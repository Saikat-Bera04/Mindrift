import cron from "node-cron";
import { prisma } from "./lib/prisma.js";
import { segregateBrowserHistory } from "./services/gemini.js";

// Run every 1 hour: "0 * * * *"
export function startBackgroundJobs() {
  console.log("Initializing background cron jobs...");

  cron.schedule("0 * * * *", async () => {
    console.log("[CRON] Running hourly extension data processing cycle...");
    await processExtensionData();
  });
}

export async function processExtensionData() {
  const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);

  try {
    // 1. Fetch distinct users who have events in the last 1 hour
    const distinctUsersData = await prisma.browserEvent.findMany({
      where: {
        occurredAt: { gte: oneHourAgo },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    const userIds = distinctUsersData.map(u => u.userId);

    for (const userId of userIds) {
      // 2. Fetch all events for this user in the window
      const events = await prisma.browserEvent.findMany({
        where: {
          userId,
          occurredAt: { gte: oneHourAgo },
        },
        orderBy: { occurredAt: "asc" },
      });

      if (events.length === 0) continue;

      // 3. Send to Gemini for segregation
      const result = await segregateBrowserHistory(events);
      const activities = result.activities;
      const insights = result.insights;

      // 4. Save mapped activities to ActivityEntry
      for (const activity of activities) {
        if (!activity.title || !activity.type) continue;
        
        await prisma.activityEntry.create({
          data: {
            userId,
            type: String(activity.type).slice(0, 50),
            title: String(activity.title).slice(0, 100),
            duration: Number(activity.duration) || 0,
            notes: String(activity.notes || "").slice(0, 255),
            intensity: String(activity.intensity || "medium"),
            date: new Date().toISOString().split("T")[0],
          }
        });
      }

      // 5. Save generated insights
      for (const insight of insights) {
         if (!insight.title || !insight.type) continue;

         await prisma.insight.create({
           data: {
             userId,
             type: String(insight.type).slice(0, 50),
             title: String(insight.title).slice(0, 100),
             content: String(insight.content || "").slice(0, 500)
           }
         });
      }

      // Optional: We can delete processed events, or mark them processed.
      // Since they are queried by time window, we leave them be, but we delete older ones periodically (like > 7 days)
      console.log(`[CRON] Processed ${events.length} events for user ${userId}. Gen: ${activities.length} acts, ${insights.length} insights.`);
    }

    // Cleanup very old browser events (older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await prisma.browserEvent.deleteMany({
      where: { occurredAt: { lt: sevenDaysAgo } }
    });
    
  } catch (error) {
    console.error("[CRON] Error running background extension cycle:", error);
  }
}
