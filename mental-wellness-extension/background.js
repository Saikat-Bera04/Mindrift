// background.js - Real-time browsing tracker connected to Mindrift API

// ─── Configuration ──────────────────────────────────────────────
const API_BASE_URL = "http://localhost:3001";
const SYNC_INTERVAL_MINUTES = 60;

const sessionStart = Date.now();
let activeTabId = null;
let activeStartTime = Date.now();
let activeDomain = null;

// ── Extract domain from URL ──
function getDomain(url) {
    try {
        return new URL(url).hostname.replace("www.", "");
    } catch {
        return null;
    }
}

// ── Generate unique batch ID ──
function generateBatchId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ── Save accumulated time for the current active domain ──
function flushActiveTime() {
    if (!activeDomain) return;
    const elapsed = Date.now() - activeStartTime;
    if (elapsed < 500) return;

    chrome.storage.local.get(["screen_time"], (data) => {
        const screenTime = data.screen_time || {};
        screenTime[activeDomain] = (screenTime[activeDomain] || 0) + elapsed;
        chrome.storage.local.set({ screen_time: screenTime });
    });
}

// ── Start tracking a new active tab ──
function startTracking(tabId) {
    chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError || !tab?.url) return;
        flushActiveTime();
        activeDomain = getDomain(tab.url);
        activeTabId = tabId;
        activeStartTime = Date.now();
    });
}

// ── Tab switched ──
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.storage.local.get(["tab_switches", "pending_events"], (data) => {
        const tabSwitches = (data.tab_switches || 0) + 1;
        const pending = data.pending_events || [];
        
        // Queue tab_switch event for backend sync
        pending.push({
            type: "tab_switch",
            source: "chrome",
            category: "productivity",
            payload: { tabCount: tabSwitches },
            timestamp: Date.now(),
            batchId: generateBatchId()
        });

        chrome.storage.local.set({ 
            tab_switches: tabSwitches,
            pending_events: pending.slice(-200)
        });
    });
    startTracking(activeInfo.tabId);
});

// ── Tab URL changed ──
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId === activeTabId && changeInfo.url) {
        startTracking(tabId);
    }
});

// ── Window focus changed ──
chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        flushActiveTime();
        activeDomain = null;
    } else {
        chrome.tabs.query({ active: true, windowId }, (tabs) => {
            if (tabs[0]) startTracking(tabs[0].id);
        });
    }
});

// ── Idle detection ──
chrome.idle.setDetectionInterval(60);

chrome.idle.onStateChanged.addListener((state) => {
    chrome.storage.local.get(["idle_log", "pending_events"], (data) => {
        const idleLog = data.idle_log || [];
        const pending = data.pending_events || [];

        idleLog.push({
            state: state,
            timestamp: new Date().toISOString()
        });

        if (state === "idle" || state === "locked") {
            pending.push({
                type: "idle_detected",
                source: "chrome",
                payload: { hourBucket: new Date().getHours() },
                timestamp: Date.now(),
                batchId: generateBatchId()
            });
        }

        chrome.storage.local.set({ 
            idle_log: idleLog.slice(-200),
            pending_events: pending.slice(-200) 
        });
    });

    if (state === "idle" || state === "locked") {
        flushActiveTime();
        activeDomain = null;
    } else if (state === "active") {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
            if (tabs[0]) startTracking(tabs[0].id);
        });
    }
});

// ── Periodic flush every 30 seconds ──
chrome.alarms.create("periodic_flush", { periodInMinutes: 0.5 });

// ── Sync to Mindrift API every N minutes ──
chrome.alarms.create("mindrift_sync", { periodInMinutes: SYNC_INTERVAL_MINUTES });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "periodic_flush") {
        flushActiveTime();
        activeStartTime = Date.now();
    }
    if (alarm.name === "mindrift_sync") {
        syncToMindrift();
    }
});

// ── Sync pending events to Mindrift backend ──
async function syncToMindrift() {
    return new Promise((resolve) => {
        chrome.storage.local.get(["pending_events", "mindrift_auth_token", "screen_time"], async (data) => {
            const pending = data.pending_events || [];
            const token = data.mindrift_auth_token;

            if (!token) {
                console.log("No auth token - skipping sync. Pair extension first.");
                resolve();
                return;
            }

            if (pending.length === 0) {
                console.log("✓ No pending events to sync.");
                resolve();
                return;
            }

            // Also create a session_end event with screen time summary
            const screenTime = data.screen_time || {};
            const totalMinutes = Math.round(Object.values(screenTime).reduce((a, b) => a + b, 0) / 60000);
            
            const eventsToSend = [
                ...pending,
                {
                    type: "session_end",
                    source: "chrome",
                    category: "productivity",
                    payload: { durationMinutes: totalMinutes },
                    timestamp: Date.now(),
                    batchId: generateBatchId()
                }
            ].slice(0, 100); // Max 100 per batch

            try {
                const response = await fetch(`${API_BASE_URL}/extension/events/batch`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ events: eventsToSend })
                });

                const result = await response.json();

                if (response.ok) {
                    console.log(`Mindrift sync: ${result.inserted} inserted, ${result.duplicates} duplicates`);
                    // Clear synced events
                    chrome.storage.local.set({ pending_events: [] });

                    // Trigger processing cycle immediately so Insights show up
                    try {
                        await fetch(`${API_BASE_URL}/extension/trigger-cron-now`, {
                            method: "POST"
                        });
                    } catch (e) {
                         console.error("Failed to trigger processing cycle:", e);
                    }
                } else {
                    console.error("Mindrift sync failed:", result.error);
                }
            } catch (err) {
                console.error("Mindrift sync network error:", err.message);
            }

            resolve();
        });
    });
}

// ── Legacy local payload flush (for popup display) ──
async function flushToBackend() {
    return new Promise((resolve) => {
        flushActiveTime();
        activeStartTime = Date.now();

        chrome.storage.local.get(
            ["screen_time", "tab_switches", "idle_log", "video_log"],
            async (data) => {
                const payload = {
                    user_id: "local_user",
                    timestamp: new Date().toISOString(),
                    screen_time: data.screen_time || {},
                    tab_switches: data.tab_switches || 0,
                    idle_log: data.idle_log || [],
                    session_duration_ms: Date.now() - sessionStart,
                    video_log: data.video_log || []
                };
                console.log("📊 Sync payload:", JSON.stringify(payload, null, 2));
                resolve();
            }
        );
    });
}

// ── Message handlers ──
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "flush_now") {
        syncToMindrift().then(() => {
            flushToBackend().then(() => sendResponse({ ok: true }));
        });
        return true;
    }

    if (msg.action === "set_auth_token") {
        chrome.storage.local.set({ mindrift_auth_token: msg.token }, () => {
            console.log("Auth token saved for Mindrift sync");
            sendResponse({ ok: true });
        });
        return true;
    }

    if (msg.action === "page_visited") {
        chrome.storage.local.get(["browsing_log", "pending_events"], (data) => {
            const log = data.browsing_log || [];
            const pending = data.pending_events || [];

            log.push({
                domain: msg.data.domain,
                title: msg.data.title,
                description: msg.data.description,
                category: msg.data.category,
                url: msg.data.url,
                timestamp: msg.data.timestamp
            });

            // Queue as backend event
            pending.push({
                type: "session_start",
                source: "chrome",
                category: mapCategory(msg.data.category),
                payload: { domainCategory: msg.data.category, hourBucket: new Date().getHours() },
                timestamp: Date.now(),
                batchId: generateBatchId()
            });

            chrome.storage.local.set({ 
                browsing_log: log.slice(-200),
                pending_events: pending.slice(-200)
            });
        });
    }

    if (msg.action === "search_logged") {
        chrome.storage.local.get(["search_log"], (data) => {
            const log = data.search_log || [];
            log.push({
                engine: msg.data.engine,
                query: msg.data.query,
                url: msg.data.url,
                timestamp: msg.data.timestamp
            });
            chrome.storage.local.set({ search_log: log.slice(-100) });
        });
    }

    if (msg.action === "video_classified") {
        chrome.storage.local.get(["video_log"], (data) => {
            const videoLog = data.video_log || [];
            videoLog.push({
                title: msg.data.title,
                category: msg.data.category,
                timestamp: msg.data.timestamp,
                url: msg.data.url
            });
            chrome.storage.local.set({ video_log: videoLog.slice(-100) });
        });
    }

    if (msg.action === "get_current_tab") {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
            if (tabs[0]) {
                sendResponse({
                    url: tabs[0].url,
                    title: tabs[0].title,
                    domain: getDomain(tabs[0].url)
                });
            } else {
                sendResponse({ url: null, title: null, domain: null });
            }
        });
        return true;
    }
});

// ── Map content categories to backend event categories ──
function mapCategory(contentCategory) {
    const map = {
        "Social Media": "social",
        "Development": "productivity",
        "Productivity": "productivity",
        "Educational": "education",
        "Entertainment": "entertainment",
        "Music": "entertainment",
        "Video": "entertainment",
        "Gaming": "entertainment",
        "News": "other",
        "Shopping": "other",
        "Health": "other",
    };
    return map[contentCategory] || "other";
}

// ── Night usage detection ──
function checkNightUsage() {
    const hour = new Date().getHours();
    if (hour >= 23 || hour < 5) {
        chrome.storage.local.get(["pending_events"], (data) => {
            const pending = data.pending_events || [];
            pending.push({
                type: "night_usage",
                source: "chrome",
                payload: { hourBucket: hour },
                timestamp: Date.now(),
                batchId: generateBatchId()
            });
            chrome.storage.local.set({ pending_events: pending.slice(-200) });
        });
    }
}

// Check night usage every 15 minutes
chrome.alarms.create("night_check", { periodInMinutes: 15 });
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "night_check") checkNightUsage();
});

// ── Initialize ──
chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    if (tabs[0]) startTracking(tabs[0].id);
});
