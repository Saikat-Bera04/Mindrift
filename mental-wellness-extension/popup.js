// popup.js

// ── Helpers ──
function formatMs(ms) {
    const m = Math.floor(ms / 60000);
    if (m < 1) return "<1m";
    if (m < 60) return `${m}m`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function formatTime(iso) {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function escHtml(str) {
    return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── Date header ──
document.getElementById("header-date").textContent =
    new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

// ── Fetch current active tab from background ──
chrome.runtime.sendMessage({ action: "get_current_tab" }, (resp) => {
    if (resp && resp.title) {
        document.getElementById("now-title").textContent = resp.title;
        document.getElementById("now-domain").textContent = resp.domain || resp.url || "";
    } else {
        document.getElementById("now-title").textContent = "No active tab";
    }
});

// ── Load all stored data ──
chrome.storage.local.get(
    ["screen_time", "tab_switches", "idle_log", "video_log", "search_log", "browsing_log"],
    (data) => {
        const screenTime = data.screen_time || {};
        const tabSwitches = data.tab_switches || 0;
        const idleLog = data.idle_log || [];
        const videoLog = data.video_log || [];
        const searchLog = data.search_log || [];
        const browsingLog = data.browsing_log || [];

        // ── Screen time ──
        const totalMs = Object.values(screenTime).reduce((a, b) => a + b, 0);
        document.getElementById("screen-time").textContent = formatMs(totalMs);

        // ── Tab switches ──
        document.getElementById("tab-switches").textContent = tabSwitches;

        // ── Idle breaks ──
        const breaks = idleLog.filter(e => e.state === "idle").length;
        document.getElementById("idle-breaks").textContent = breaks;

        // ── Wellness score ──
        let score = 100;
        const hours = totalMs / 3600000;
        if (hours > 6) score -= 40;
        else if (hours > 3) score -= 20;
        if (tabSwitches > 80) score -= 30;
        else if (tabSwitches > 40) score -= 15;
        if (breaks < 2) score -= 15;

        // Penalize heavy sad/news content watching
        const sadVideos = videoLog.filter(v => v.category === "Sad Content" || v.category === "News").length;
        if (sadVideos > 5) score -= 10;

        score = Math.max(0, score);

        const ring = document.getElementById("score-ring");
        ring.textContent = score;
        ring.style.borderColor = score > 70 ? "#4ade80" : score > 40 ? "#facc15" : "#f87171";

        const desc = document.getElementById("score-desc");
        if (score > 70) desc.textContent = "Looking healthy! Keep taking breaks.";
        else if (score > 40) desc.textContent = "Moderate usage — try stepping away soon.";
        else desc.textContent = "High stress signals. Time for a break!";

        // ── Top 5 sites by time ──
        const sorted = Object.entries(screenTime)
            .filter(([, ms]) => ms > 1000)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const sitesList = document.getElementById("sites-list");
        if (sorted.length === 0) {
            sitesList.innerHTML = `<div class="empty-msg">Browse a bit to see data</div>`;
        } else {
            const maxTime = sorted[0][1] || 1;
            sitesList.innerHTML = sorted.map(([domain, ms]) => {
                const pct = Math.round((ms / maxTime) * 100);
                return `
                <div class="site-bar">
                    <span class="site-name" title="${escHtml(domain)}">${escHtml(domain)}</span>
                    <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
                    <span class="site-time">${formatMs(ms)}</span>
                </div>`;
            }).join("");
        }

        // ── Recent searches (last 7) ──
        const searchList = document.getElementById("search-list");
        const recentSearches = [...searchLog].reverse().slice(0, 7);
        if (recentSearches.length === 0) {
            searchList.innerHTML = `<div class="empty-msg">Search on Google, Bing, or YouTube</div>`;
        } else {
            searchList.innerHTML = recentSearches.map(s => `
                <div class="search-item">
                    <span class="search-engine">${escHtml(s.engine)}</span>
                    <span class="search-query">${escHtml(s.query)}</span>
                    <span class="search-time">${formatTime(s.timestamp)}</span>
                </div>`).join("");
        }

        // ── Recent browsing (last 8) ──
        const browseList = document.getElementById("browse-list");
        const recentPages = [...browsingLog].reverse().slice(0, 8);
        if (recentPages.length === 0) {
            browseList.innerHTML = `<div class="empty-msg">Visit some pages to see history</div>`;
        } else {
            browseList.innerHTML = recentPages.map(p => {
                const catClass = `cat-${(p.category || "Other").replace(/\s+/g, "")}`;
                return `
                <div class="browse-item">
                    <span class="browse-category ${catClass}">${escHtml(p.category || "Other")}</span>
                    <span class="browse-title" title="${escHtml(p.title)}">${escHtml(p.title || p.domain)}</span>
                    <span class="browse-time">${formatTime(p.timestamp)}</span>
                </div>`;
            }).join("");
        }

        // ── Recent YouTube videos (last 5) ──
        const videoList = document.getElementById("video-list");
        const recentVideos = [...videoLog].reverse().slice(0, 5);
        if (recentVideos.length === 0) {
            videoList.innerHTML = `<div class="empty-msg">Visit YouTube to see tracked videos</div>`;
        } else {
            videoList.innerHTML = recentVideos.map(v => `
                <div class="video-item">
                    <div class="video-title" title="${escHtml(v.title)}">${escHtml(v.title || "Unknown video")}</div>
                    <div class="video-meta">
                        <span class="video-category">${escHtml(v.category)}</span>
                        <span class="video-time">${formatTime(v.timestamp)}</span>
                    </div>
                </div>`).join("");
        }
    }
);

// ── Sync button ──
document.getElementById("sync-btn").addEventListener("click", () => {
    const btn = document.getElementById("sync-btn");
    btn.textContent = "Syncing...";
    btn.disabled = true;
    chrome.runtime.sendMessage({ action: "flush_now" }, () => {
        btn.textContent = "✓ Synced!";
        setTimeout(() => { btn.textContent = "↑ Sync now"; btn.disabled = false; }, 2000);
    });
});

// ── Clear data button ──
document.getElementById("clear-btn").addEventListener("click", () => {
    if (!confirm("Clear all tracked data?")) return;
    chrome.storage.local.set({
        screen_time: {}, tab_switches: 0, idle_log: [],
        video_log: [], search_log: [], browsing_log: []
    }, () => location.reload());
});