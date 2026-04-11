// content.js — Runs on EVERY page, extracts content info

// ── Extract search query from search engine URLs ──
function getSearchQuery() {
    const url = new URL(window.location.href);
    const host = url.hostname;

    // Google
    if (host.includes("google.com") && url.pathname === "/search") {
        return { engine: "Google", query: url.searchParams.get("q") };
    }
    // Bing
    if (host.includes("bing.com") && url.pathname === "/search") {
        return { engine: "Bing", query: url.searchParams.get("q") };
    }
    // DuckDuckGo
    if (host.includes("duckduckgo.com")) {
        return { engine: "DuckDuckGo", query: url.searchParams.get("q") };
    }
    // Yahoo
    if (host.includes("search.yahoo.com")) {
        return { engine: "Yahoo", query: url.searchParams.get("p") };
    }
    // YouTube search
    if (host.includes("youtube.com") && url.pathname === "/results") {
        return { engine: "YouTube", query: url.searchParams.get("search_query") };
    }

    return null;
}

// ── Classify page content by domain + title keywords ──
function classifyPage(domain, title) {
    title = (title || "").toLowerCase();
    domain = (domain || "").toLowerCase();

    // Social media
    if (["facebook.com", "instagram.com", "twitter.com", "x.com", "tiktok.com", "reddit.com", "snapchat.com", "linkedin.com", "threads.net"].some(d => domain.includes(d))) {
        return "Social Media";
    }
    // Video/streaming
    if (["youtube.com", "netflix.com", "twitch.tv", "primevideo.com", "hotstar.com", "disneyplus.com", "hulu.com"].some(d => domain.includes(d))) {
        return classifyVideoContent(title);
    }
    // News
    if (["cnn.com", "bbc.com", "theguardian.com", "nytimes.com", "reuters.com", "ndtv.com", "timesofindia.com", "news.google.com"].some(d => domain.includes(d)) ||
        title.includes("news") || title.includes("breaking")) {
        return "News";
    }
    // Shopping
    if (["amazon.", "flipkart.com", "myntra.com", "ebay.com", "walmart.com", "aliexpress.com", "meesho.com"].some(d => domain.includes(d))) {
        return "Shopping";
    }
    // Coding/Dev
    if (["github.com", "gitlab.com", "stackoverflow.com", "leetcode.com", "codepen.io", "replit.com", "hackerrank.com", "codeforces.com"].some(d => domain.includes(d))) {
        return "Development";
    }
    // Education
    if (["coursera.org", "udemy.com", "edx.org", "khanacademy.org", "geeksforgeeks.org", "w3schools.com", "mdn", "medium.com"].some(d => domain.includes(d)) ||
        title.includes("tutorial") || title.includes("learn") || title.includes("course") || title.includes("study")) {
        return "Educational";
    }
    // Email/Productivity
    if (["gmail.com", "mail.google.com", "outlook.com", "notion.so", "docs.google.com", "sheets.google.com", "slack.com", "discord.com", "trello.com"].some(d => domain.includes(d))) {
        return "Productivity";
    }
    // Health
    if (["webmd.com", "mayoclinic.org", "healthline.com", "1mg.com", "practo.com"].some(d => domain.includes(d)) ||
        title.includes("health") || title.includes("mental") || title.includes("anxiety") || title.includes("depression")) {
        return "Health";
    }
    // Gaming
    if (["store.steampowered.com", "twitch.tv", "epicgames.com", "roblox.com"].some(d => domain.includes(d)) ||
        title.includes("game") || title.includes("gaming")) {
        return "Gaming";
    }
    // Adult/sensitive - for wellness tracking purposes
    if (title.includes("nsfw") || title.includes("adult")) {
        return "Sensitive";
    }

    return "Other";
}

// ── Classify YouTube / video content specifically ──
function classifyVideoContent(title) {
    if (title.includes("motivation") || title.includes("success") || title.includes("discipline") || title.includes("productivity")) {
        return "Motivation";
    }
    if (title.includes("sad") || title.includes("emotional") || title.includes("crying") || title.includes("hurt") || title.includes("pain") || title.includes("depressed")) {
        return "Sad Content";
    }
    if (title.includes("funny") || title.includes("comedy") || title.includes("meme") || title.includes("laugh") || title.includes("prank")) {
        return "Entertainment";
    }
    if (title.includes("news") || title.includes("breaking") || title.includes("update") || title.includes("politics")) {
        return "News";
    }
    if (title.includes("study") || title.includes("learn") || title.includes("tutorial") || title.includes("how to") || title.includes("course") || title.includes("lecture")) {
        return "Educational";
    }
    if (title.includes("music") || title.includes("song") || title.includes("lyrics") || title.includes("remix") || title.includes("album")) {
        return "Music";
    }
    if (title.includes("game") || title.includes("gameplay") || title.includes("walkthrough") || title.includes("stream")) {
        return "Gaming";
    }
    return "Video";
}

// ── Wait for page to load, then extract and send everything ──
setTimeout(() => {
    const domain = window.location.hostname.replace("www.", "");
    const title = document.title || "";
    const metaDesc = document.querySelector("meta[name='description']")?.content || "";
    const metaKeywords = document.querySelector("meta[name='keywords']")?.content || "";
    const url = window.location.href;
    const category = classifyPage(domain, title);

    // ── Send page visit data ──
    chrome.runtime.sendMessage({
        action: "page_visited",
        data: {
            domain: domain,
            title: title.substring(0, 200),
            description: metaDesc.substring(0, 300),
            keywords: metaKeywords.substring(0, 200),
            category: category,
            url: url,
            timestamp: new Date().toISOString()
        }
    });

    // ── Detect and send search queries ──
    const search = getSearchQuery();
    if (search && search.query) {
        chrome.runtime.sendMessage({
            action: "search_logged",
            data: {
                engine: search.engine,
                query: search.query,
                url: url,
                timestamp: new Date().toISOString()
            }
        });
    }

    // ── YouTube-specific: classify video ──
    if (domain.includes("youtube.com") && window.location.pathname === "/watch") {
        const videoTitle = title.replace("- YouTube", "").trim();
        chrome.runtime.sendMessage({
            action: "video_classified",
            data: {
                title: videoTitle,
                category: classifyVideoContent(videoTitle.toLowerCase()),
                keywords: metaKeywords,
                url: url,
                timestamp: new Date().toISOString()
            }
        });
    }

}, 2500); // wait for page to fully render
