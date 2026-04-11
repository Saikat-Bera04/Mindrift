// utils/tracker.js

// Categorize websites by type
const SITE_CATEGORIES = {
    social: ["facebook.com", "instagram.com", "twitter.com", "tiktok.com", "reddit.com"],
    work: ["github.com", "gitlab.com", "notion.so", "linear.app", "jira.atlassian.com"],
    video: ["youtube.com", "netflix.com", "twitch.tv", "primevideo.com"],
    news: ["cnn.com", "bbc.com", "theguardian.com", "news.ycombinator.com"],
    health: ["webmd.com", "mayoclinic.org", "healthline.com"]
};

export function categorizeDomain(domain) {
    for (const [category, domains] of Object.entries(SITE_CATEGORIES)) {
        if (domains.some(d => domain.includes(d))) return category;
    }
    return "other";
}

// Calculate simple stress score from behavior data
// Your backend will do the real ML — this is just local preview
export function calcLocalStressScore({ screen_time, tab_switches, idle_log }) {
    let score = 0;

    // High screen time = stress signal
    const totalMs = Object.values(screen_time || {}).reduce((a, b) => a + b, 0);
    const hours = totalMs / 3600000;
    if (hours > 6) score += 40;
    else if (hours > 3) score += 20;

    // Rapid tab switching = distraction
    if (tab_switches > 80) score += 30;
    else if (tab_switches > 40) score += 15;

    // High idle time = good (rest) or bad (avoidance)?
    const idleEvents = (idle_log || []).filter(e => e.state === "idle").length;
    if (idleEvents < 2) score += 15; // never took a break

    return Math.min(score, 100);
}

export function formatMs(ms) {
    const m = Math.floor(ms / 60000);
    if (m < 60) return `${m}m`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
}