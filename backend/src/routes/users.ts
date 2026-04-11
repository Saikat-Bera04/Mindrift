import { Router, Request, Response } from "express";
import { createClerkClient } from "@clerk/backend";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/clerk.js";

export const usersRouter = Router();

const clerkClient = process.env.CLERK_SECRET_KEY
  ? createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
  : null;

function optionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function calculateBmi(height?: number, weight?: number): number | undefined {
  if (!height || !weight || height <= 0 || weight <= 0) return undefined;
  return Number((weight / (height / 100) ** 2).toFixed(1));
}

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

async function ensureGamification(userId: string) {
  await prisma.gamification.upsert({
    where: { userId },
    create: {
      userId,
      xp: 0,
      level: 1,
      streak: 0,
    },
    update: {},
  });
}

async function getClerkProfile(clerkUserId: string) {
  if (!clerkClient) {
    return { email: undefined, displayName: undefined };
  }

  try {
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    const primaryEmail =
      clerkUser.emailAddresses.find(
        (emailAddress) => emailAddress.id === clerkUser.primaryEmailAddressId,
      )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

    return {
      email: cleanString(primaryEmail),
      displayName: cleanString(clerkUser.fullName) ?? cleanString(clerkUser.username),
    };
  } catch (error) {
    console.error("Unable to fetch Clerk user profile:", error);
    return { email: undefined, displayName: undefined };
  }
}

// POST /api/users/sync - Sync or create user
usersRouter.post("/sync", requireAuth, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.clerkUserId!;
    const clerkProfile = await getClerkProfile(clerkUserId);
    const email = cleanString(req.body.email) ?? clerkProfile.email;
    const displayName =
      cleanString(req.body.displayName) ?? clerkProfile.displayName ?? email ?? "User";
    const age = optionalNumber(req.body.age);
    const height = optionalNumber(req.body.height);
    const weight = optionalNumber(req.body.weight);
    const bmi = optionalNumber(req.body.bmi) ?? calculateBmi(height, weight);
    const bloodPressure = cleanString(req.body.bloodPressure);
    const currentStatus = cleanString(req.body.currentStatus);
    const jobStudyDescription = cleanString(req.body.jobStudyDescription);
    const likes = cleanString(req.body.likes);
    const dislikes = cleanString(req.body.dislikes);
    const relationshipStatus = cleanString(req.body.relationshipStatus);
    const workingHours = optionalNumber(req.body.workingHours);
    const sleepHours = optionalNumber(req.body.sleepHours);

    if (!height || !weight || !age || !bloodPressure || !currentStatus || !relationshipStatus) {
      return res.status(400).json({
        error: "Missing required onboarding fields",
      });
    }

    const profileData = {
      email,
      displayName,
      age,
      height,
      weight,
      bmi,
      bloodPressure,
      currentStatus,
      jobStudyDescription,
      likes,
      dislikes,
      relationshipStatus,
      workingHours,
      sleepHours,
    };

    let user = await prisma.$transaction(async (tx) => {
      const existingByClerk = await tx.user.findUnique({
        where: { clerkId: clerkUserId },
      });

      if (existingByClerk) {
        const emailOwner =
          email && email !== existingByClerk.email
            ? await tx.user.findUnique({ where: { email } })
            : null;

        return tx.user.update({
          where: { id: existingByClerk.id },
          data: {
            ...profileData,
            email: emailOwner && emailOwner.id !== existingByClerk.id ? existingByClerk.email : email,
          },
          include: {
            gamification: true,
          },
        });
      }

      if (email) {
        const existingByEmail = await tx.user.findUnique({
          where: { email },
        });

        if (existingByEmail) {
          return tx.user.update({
            where: { id: existingByEmail.id },
            data: {
              clerkId: clerkUserId,
              ...profileData,
            },
            include: {
              gamification: true,
            },
          });
        }
      }

      return tx.user.create({
        data: {
          clerkId: clerkUserId,
          ...profileData,
          gamification: {
            create: {
              xp: 0,
              level: 1,
              streak: 0,
            },
          },
        },
        include: {
          gamification: true,
        },
      });
    });

    if (!user.gamification) {
      await ensureGamification(user.id);
      user = await prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        include: {
          gamification: true,
        },
      });
    }

    const userWithGamification = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: {
        gamification: true,
      },
    });

    res.json({ success: true, user: userWithGamification });
  } catch (error: any) {
    console.error("Error syncing user:", error);
    res.status(500).json({
      error: "Failed to sync user",
      ...(process.env.NODE_ENV !== "production"
        ? { detail: error?.message, code: error?.code }
        : {}),
    });
  }
});

// GET /api/users/me - Get current user
usersRouter.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.clerkUserId!;

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      include: {
        gamification: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});
