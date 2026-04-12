import { Router, Request, Response } from "express";
import { HELPLINES } from "../constants/helplines.js";

export const supportRouter = Router();

// GET /support/helplines - Get mental health helpline numbers
supportRouter.get("/helplines", async (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      helplines: HELPLINES
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch helpline numbers" });
  }
});

// GET /support/therapists - Placeholder for therapist scraping/listing
supportRouter.get("/therapists", async (_req: Request, res: Response) => {
  try {
    // For now, return a curated list or empty array if scraping is not yet implemented
    res.json({
      success: true,
      therapists: [
        { name: "Dr. Ananya Sharma", specialty: "Anxiety & Depression", location: "Mumbai / Online", contact: "info@example.com" },
        { name: "Siddharth Verma", specialty: "CBT & Mindfulness", location: "Bangalore / Online", contact: "sid@example.com" }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch therapist list" });
  }
});
