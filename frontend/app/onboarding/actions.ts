"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

export async function saveUserOnboardingData(data: Record<string, any>) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized: No user logged in.");
  }

  const client = await clerkClient();

  try {
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        onboardingData: data,
        onboardingComplete: true
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to update user DB metadata", error);
    throw new Error("Database insertion failed");
  }
}
