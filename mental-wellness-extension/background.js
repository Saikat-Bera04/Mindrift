// background.js — Real-time browsing tracker

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

// ── Save accumulated time for the current active domain ──
function flushActiveTime() {
    if (!activeDomain) return;
    const elapsed = Date.now() - activeStartTime;
    if (elapsed < 500) return; // ignore tiny blips

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

        // Flush time for previous domain
        flushActiveTime();

        // Start new tracking
        activeDomain = getDomain(tab.url);
        activeTabId = tabId;
        activeStartTime = Date.now();
    });
}

// ── Tab switched ──
chrome.tabs.onActivated.addListener((activeInfo) => {
    // Count tab switch
    chrome.storage.local.get(["tab_switches"], (data) => {
        chrome.storage.local.set({ tab_switches: (data.tab_switches || 0) + 1 });
    });

    startTracking(activeInfo.tabId);
});

// ── Tab URL changed (navigation within same tab) ──
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId === activeTabId && changeInfo.url) {
        startTracking(tabId);
    }
});

// ── Window focus changed ──
chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        // Browser lost focus — flush and stop
        flushActiveTime();
        activeDomain = null;
    } else {
        // Browser regained focus — find active tab
        chrome.tabs.query({ active: true, windowId }, (tabs) => {
            if (tabs[0]) startTracking(tabs[0].id);
        });
    }
});

// ── Idle detection (triggers after 60s of inactivity) ──
chrome.idle.setDetectionInterval(60);

chrome.idle.onStateChanged.addListener((state) => {
    chrome.storage.local.get(["idle_log"], (data) => {
        const idleLog = data.idle_log || [];
        idleLog.push({
            state: state, // "active", "idle", or "locked"
            timestamp: new Date().toISOString()
        });
        // Keep last 200 entries
        chrome.storage.local.set({ idle_log: idleLog.slice(-200) });
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

// ── Periodic flush every 30 seconds (so data stays fresh) ──
chrome.alarms.create("periodic_flush", { periodInMinutes: 0.5 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "periodic_flush") {
        flushActiveTime();
        activeStartTime = Date.now(); // restart timer
    }
});

// ── Flush to backend (logs to console for now — replace URL when ready) ──
async function flushToBackend() {
    return new Promise((resolve) => {
        // Flush active time first so data is up-to-date
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

                // TODO: Uncomment and replace URL when backend is ready
                // try {
                //     await fetch("https://your-backend-api.com/sync", {
                //         method: "POST",
                //         headers: { "Content-Type": "application/json" },
                //         body: JSON.stringify(payload)
                //     });
                // } catch (err) {
                //     console.error("flushToBackend failed:", err);
                // }

                resolve();
            }
        );
    });
}

// ── Message handlers ──
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "flush_now") {
        flushToBackend().then(() => sendResponse({ ok: true }));
        return true; // keep channel open for async
    }

    // ── Page visit tracking ──
    if (msg.action === "page_visited") {
        chrome.storage.local.get(["browsing_log"], (data) => {
            const log = data.browsing_log || [];
            log.push({
                domain: msg.data.domain,
                title: msg.data.title,
                description: msg.data.description,
                category: msg.data.category,
                url: msg.data.url,
                timestamp: msg.data.timestamp
            });
            // Keep last 200 page visits
            chrome.storage.local.set({ browsing_log: log.slice(-200) });
        });
    }

    // ── Search query tracking ──
    if (msg.action === "search_logged") {
        chrome.storage.local.get(["search_log"], (data) => {
            const log = data.search_log || [];
            log.push({
                engine: msg.data.engine,
                query: msg.data.query,
                url: msg.data.url,
                timestamp: msg.data.timestamp
            });
            // Keep last 100 searches
            chrome.storage.local.set({ search_log: log.slice(-100) });
        });
    }

    // ── YouTube video tracking ──
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

    // ── Get current active tab (for popup) ──
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
        return true; // async
    }
});

// ── Initialize: start tracking the current tab on service worker start ──
chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    if (tabs[0]) startTracking(tabs[0].id);
});
