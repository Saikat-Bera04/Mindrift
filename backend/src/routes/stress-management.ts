import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/clerk.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const stressManagementRouter = Router();

// Therapist database with hardcoded data for demo
const THERAPIST_DATABASE = [
  {
    id: "t1",
    name: "Dr. Anjali Sharma",
    specialization: "Anxiety & Stress Management",
    qualifications: "PhD Psychology (Delhi University), IACP Certified",
    phone: "+91-98765-43210",
    email: "dr.anjali.sharma@mindwheel.in",
    experience: 12,
    rating: 4.9,
    sessionFee: 800,
    languages: ["English", "Hindi"],
    availability: "Mon-Fri, 10 AM - 6 PM",
    city: "Delhi",
    type: "Clinical Psychologist",
    description: "Specializes in cognitive behavioral therapy and stress management for professionals"
  },
  {
    id: "t2",
    name: "Dr. Rohan Patel",
    specialization: "Depression & Life Coaching",
    qualifications: "M.Phil Counseling (Bangalore University), NLP Practitioner",
    phone: "+91-98765-43211",
    email: "dr.rohan.patel@mindwheel.in",
    experience: 8,
    rating: 4.8,
    sessionFee: 700,
    languages: ["English", "Gujarati", "Hindi"],
    availability: "Tue-Sat, 12 PM - 8 PM",
    city: "Bangalore",
    type: "Counselor",
    description: "Expert in helping individuals overcome depression and achieve life goals"
  },
  {
    id: "t3",
    name: "Dr. Priya Menon",
    specialization: "Student Stress & Career",
    qualifications: "M.Ed Counseling (IIIT-D), Career Guidance Certified",
    phone: "+91-98765-43212",
    email: "dr.priya.menon@mindwheel.in",
    experience: 6,
    rating: 4.7,
    sessionFee: 600,
    languages: ["English", "Malayalam", "Hindi"],
    availability: "Mon-Sat, 3 PM - 9 PM",
    city: "Hyderabad",
    type: "Career Counselor",
    description: "Focused on helping students manage academic stress and career planning"
  },
  {
    id: "t4",
    name: "Dr. Vikram Gupta",
    specialization: "Workplace Stress & Burnout",
    qualifications: "Executive MBA (IIM-A), Organizational Psychology",
    phone: "+91-98765-43213",
    email: "dr.vikram.gupta@mindwheel.in",
    experience: 15,
    rating: 4.9,
    sessionFee: 1200,
    languages: ["English", "Hindi"],
    availability: "Mon-Fri, 6 PM - 10 PM",
    city: "Mumbai",
    type: "Organizational Psychologist",
    description: "Expert in helping professionals deal with workplace stress and burnout"
  },
  {
    id: "t5",
    name: "Dr. Sneha Desai",
    specialization: "Family & Relationship Therapy",
    qualifications: "MA Family Therapy (Pune University), Certified Therapist",
    phone: "+91-98765-43214",
    email: "dr.sneha.desai@mindwheel.in",
    experience: 10,
    rating: 4.8,
    sessionFee: 900,
    languages: ["English", "Marathi", "Hindi"],
    availability: "Wed-Sun, 2 PM - 8 PM",
    city: "Pune",
    type: "Family Therapist",
    description: "Specializes in family conflicts and relationship management"
  },
  {
    id: "t6",
    name: "Dr. Amit Khanna",
    specialization: "Youth & Adolescent Psychology",
    qualifications: "M.Psy Developmental (Delhi University), Teen Counseling Expert",
    phone: "+91-98765-43215",
    email: "dr.amit.khanna@mindwheel.in",
    experience: 9,
    rating: 4.7,
    sessionFee: 650,
    languages: ["English", "Hindi", "Punjabi"],
    availability: "Mon-Sat, 4 PM - 10 PM",
    city: "Chandigarh",
    type: "Developmental Psychologist",
    description: "Expert in helping teenagers navigate stress, peer pressure, and emotional challenges"
  }
];

// AI-powered stress management suggestions
async function generateStressSuggestions(stressLevel: number, factors: any, userMood?: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are an empathetic mental health advisor. Based on the following stress assessment, provide 3-4 specific, actionable suggestions for stress management.

Stress Level: ${stressLevel}/10
Stress Factors: ${JSON.stringify(factors, null, 2)}
User's Mood Context: ${userMood || "Not provided"}

Provide suggestions that are:
1. Immediate/short-term (can do in next 30 minutes)
2. Medium-term (this week)
3. Long-term lifestyle changes
4. When to seek professional help

Format as a JSON object with keys: "immediate", "medium_term", "long_term", "when_to_seek_help"
Keep each suggestion concise and actionable.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  return {
    immediate: "Take 5 deep breaths and step outside for fresh air",
    medium_term: "Start a regular exercise routine",
    long_term: "Establish healthy sleep and work-life balance",
    when_to_seek_help: "Consult a therapist if stress persists for more than 2 weeks"
  };
}

// GET /stress-management/current - Get current stress level with suggestions
stressManagementRouter.get("/current", requireAuth, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.clerkUserId!;

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      include: { stressLevel: { orderBy: { updatedAt: "desc" }, take: 1 } }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentStreak = user.stressLevel?.[0];
    const stressValue = currentStreak?.level || 0;

    let suggestions = {};
    if (stressValue >= 7) {
      suggestions = await generateStressSuggestions(
        stressValue,
        { sleep: "poor", workload: "high", mood: "anxious" },
        user.currentStatus
      );
    }

    res.json({
      stressLevel: stressValue,
      lastUpdated: currentStreak?.updatedAt,
      status: stressValue >= 8 ? "critical" : stressValue >= 6 ? "high" : stressValue >= 4 ? "moderate" : "low",
      suggestions,
      recommendedTherapists: stressValue >= 7 ? THERAPIST_DATABASE.slice(0, 3) : []
    });
  } catch (error) {
    console.error("Error fetching current stress:", error);
    res.status(500).json({ error: "Failed to fetch stress data" });
  }
});

// GET /stress-management/therapists - Get recommended therapists
stressManagementRouter.get("/therapists", requireAuth, async (req: Request, res: Response) => {
  try {
    const { specialization, city, maxFee } = req.query;

    let filtered = [...THERAPIST_DATABASE];

    if (specialization) {
      filtered = filtered.filter(t =>
        t.specialization.toLowerCase().includes((specialization as string).toLowerCase())
      );
    }

    if (city) {
      filtered = filtered.filter(t =>
        t.city.toLowerCase().includes((city as string).toLowerCase())
      );
    }

    if (maxFee) {
      filtered = filtered.filter(t => t.sessionFee <= parseInt(maxFee as string));
    }

    res.json({
      total: filtered.length,
      therapists: filtered.sort((a, b) => b.rating - a.rating)
    });
  } catch (error) {
    console.error("Error fetching therapists:", error);
    res.status(500).json({ error: "Failed to fetch therapists" });
  }
});

// GET /stress-management/therapists/:id - Get therapist details
stressManagementRouter.get("/therapists/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const therapist = THERAPIST_DATABASE.find(t => t.id === req.params.id);

    if (!therapist) {
      return res.status(404).json({ error: "Therapist not found" });
    }

    res.json(therapist);
  } catch (error) {
    console.error("Error fetching therapist:", error);
    res.status(500).json({ error: "Failed to fetch therapist" });
  }
});

// POST /stress-management/book - Book a therapist session
stressManagementRouter.post("/book", requireAuth, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.clerkUserId!;
    const { therapistId, sessionDate, notes } = req.body;

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const therapist = THERAPIST_DATABASE.find(t => t.id === therapistId);
    if (!therapist) {
      return res.status(404).json({ error: "Therapist not found" });
    }

    // Create booking record (if you have a TherapySession model)
    // For now, just return confirmation
    res.json({
      bookingConfirmed: true,
      bookingId: `BOOK-${Date.now()}`,
      therapist: {
        name: therapist.name,
        phone: therapist.phone,
        email: therapist.email
      },
      sessionDate,
      notes,
      message: "Your session has been scheduled. The therapist will contact you shortly."
    });
  } catch (error) {
    console.error("Error booking session:", error);
    res.status(500).json({ error: "Failed to book session" });
  }
});

// GET /stress-management/demo-data - Get hardcoded demo data for presentation
stressManagementRouter.get("/demo-data", async (req: Request, res: Response) => {
  try {
    res.json({
      user: {
        name: "Arjun Singh",
        age: 26,
        email: "arjun@example.com",
        joinDate: "2024-01-15",
        currentStatus: "Working Professional",
        workingHours: 10,
        sleepHours: 6
      },
      stressData: {
        currentLevel: 8.2,
        status: "High",
        trend: "increasing",
        lastUpdated: new Date().toISOString(),
        factors: {
          sleep: { score: 3, impact: "high", details: "Averaging only 6 hours per night" },
          physical: { score: 4, impact: "medium", details: "Limited exercise, mostly sedentary work" },
          digital: { score: 8, impact: "high", details: "Screen time 12+ hours daily, heavy social media usage" },
          emotional: { score: 7, impact: "high", details: "Work pressure, relationship concerns" }
        }
      },
      suggestions: {
        immediate: "Take a 10-minute walk outside, practice 4-7-8 breathing technique",
        medium_term: "Start morning yoga (20 mins daily), maintain consistent sleep schedule",
        long_term: "Reduce screen time by 2 hours daily, pursue hobby activities",
        when_to_seek_help: "Consider professional help if stress persists beyond 2 weeks"
      },
      recommendedTherapists: THERAPIST_DATABASE.slice(0, 3),
      insights: [
        {
          date: "2024-12-10",
          insight: "Your stress levels have increased 35% this month. This correlates with increased work hours.",
          recommendation: "Schedule regular breaks and consider delegation of tasks."
        },
        {
          date: "2024-12-08",
          insight: "You showed signs of poor sleep which directly impacts stress levels.",
          recommendation: "Maintain a consistent sleep schedule. Aim for 8 hours minimum."
        },
        {
          date: "2024-12-05",
          insight: "High digital engagement noticed. Excessive screen time increases anxiety.",
          recommendation: "Implement digital detox: No screens 1 hour before bed."
        }
      ],
      wellnessScore: 45,
      improvementPotential: 55,
      estimatedRecoveryTime: "3-4 weeks with consistent stress management"
    });
  } catch (error) {
    console.error("Error fetching demo data:", error);
    res.status(500).json({ error: "Failed to fetch demo data" });
  }
});
