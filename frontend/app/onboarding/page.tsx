"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { getBackendOrigin } from "@/lib/backend-url";

type OnboardingForm = {
  height: string;
  weight: string;
  bloodPressure: string;
  age: string;
  currentStatus: string;
  jobStudyDescription: string;
  likes: string;
  dislikes: string;
  relationshipStatus: string;
  workingHours: string;
  sleepHours: string;
};

const initialForm: OnboardingForm = {
  height: "",
  weight: "",
  bloodPressure: "",
  age: "",
  currentStatus: "",
  jobStudyDescription: "",
  likes: "",
  dislikes: "",
  relationshipStatus: "",
  workingHours: "",
  sleepHours: "",
};

const statusOptions = ["Student", "Employee", "Worker", "Other"];
const relationshipOptions = ["Single", "In a Relationship", "Complicated", "Prefer not to say"];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-bold uppercase tracking-wider text-muted-fg">{children}</span>;
}

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const { getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<OnboardingForm>(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedJson, setSavedJson] = useState<Record<string, unknown> | null>(null);

  const bmi = useMemo(() => {
    const height = Number(formData.height);
    const weight = Number(formData.weight);
    if (!height || !weight || height <= 0 || weight <= 0) return "";
    return (weight / (height / 100) ** 2).toFixed(1);
  }, [formData.height, formData.weight]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const validate = () => {
    const required: Array<keyof OnboardingForm> = [
      "height",
      "weight",
      "bloodPressure",
      "age",
      "currentStatus",
      "jobStudyDescription",
      "likes",
      "dislikes",
      "relationshipStatus",
      "workingHours",
      "sleepHours",
    ];

    const missing = required.filter((key) => !formData[key].trim());
    if (missing.length > 0) {
      return "Please fill every field before continuing.";
    }

    if (!bmi) {
      return "Enter a valid height and weight so BMI can be calculated.";
    }

    return "";
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      if (!isAuthLoaded || !isSignedIn) {
        router.push("/sign-in?redirect_url=/onboarding");
        return;
      }

      const token = await getToken();
      if (!token) {
        setError("Authentication failed. Please sign in again.");
        setIsLoading(false);
        return;
      }

      const payload = {
        displayName: user?.fullName,
        email: user?.primaryEmailAddress?.emailAddress,
        height: Number(formData.height),
        weight: Number(formData.weight),
        bmi: Number(bmi),
        bloodPressure: formData.bloodPressure.trim(),
        age: Number(formData.age),
        currentStatus: formData.currentStatus,
        jobStudyDescription: formData.jobStudyDescription.trim(),
        likes: formData.likes.trim(),
        dislikes: formData.dislikes.trim(),
        relationshipStatus: formData.relationshipStatus,
        workingHours: Number(formData.workingHours),
        sleepHours: Number(formData.sleepHours),
      };

      const response = await fetch(`${getBackendOrigin()}/api/users/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || data.error || "Failed to save profile");
      }

      setSavedJson(payload);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  if (!isLoaded || !isAuthLoaded) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">Personal analysis setup</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Sentiment and lifestyle profile
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-fg">
            Share the basics that help Mindrift understand your health, routine, preferences, and daily context.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg bg-panel p-5 shadow-floating sm:p-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Basic Health</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <label className="block">
                <FieldLabel>Height (cm)</FieldLabel>
                <input name="height" type="number" min="1" value={formData.height} onChange={handleChange} className="mt-2 h-12 w-full rounded-lg bg-background px-4 shadow-recessed outline-none focus:ring-2 focus:ring-accent/40" required />
              </label>
              <label className="block">
                <FieldLabel>Weight (kg)</FieldLabel>
                <input name="weight" type="number" min="1" step="0.1" value={formData.weight} onChange={handleChange} className="mt-2 h-12 w-full rounded-lg bg-background px-4 shadow-recessed outline-none focus:ring-2 focus:ring-accent/40" required />
              </label>
              <label className="block">
                <FieldLabel>BMI</FieldLabel>
                <input value={bmi} readOnly className="mt-2 h-12 w-full rounded-lg bg-background px-4 font-mono font-bold text-accent shadow-recessed outline-none" placeholder="Auto" />
              </label>
              <label className="block">
                <FieldLabel>Blood Pressure</FieldLabel>
                <input name="bloodPressure" value={formData.bloodPressure} onChange={handleChange} placeholder="120/80" className="mt-2 h-12 w-full rounded-lg bg-background px-4 shadow-recessed outline-none focus:ring-2 focus:ring-accent/40" required />
              </label>
              <label className="block">
                <FieldLabel>Age</FieldLabel>
                <input name="age" type="number" min="1" max="150" value={formData.age} onChange={handleChange} className="mt-2 h-12 w-full rounded-lg bg-background px-4 shadow-recessed outline-none focus:ring-2 focus:ring-accent/40" required />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg bg-panel p-5 shadow-floating sm:p-6">
              <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Lifestyle</h2>
              <div className="mt-5 space-y-4">
                <label className="block">
                  <FieldLabel>Current Status</FieldLabel>
                  <select name="currentStatus" value={formData.currentStatus} onChange={handleChange} className="mt-2 h-12 w-full rounded-lg bg-background px-4 shadow-recessed outline-none focus:ring-2 focus:ring-accent/40" required>
                    <option value="">Select status</option>
                    {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label className="block">
                  <FieldLabel>Job / Study Description</FieldLabel>
                  <textarea name="jobStudyDescription" value={formData.jobStudyDescription} onChange={handleChange} rows={5} className="mt-2 w-full resize-none rounded-lg bg-background px-4 py-3 shadow-recessed outline-none focus:ring-2 focus:ring-accent/40" required />
                </label>
              </div>
            </div>

            <div className="rounded-lg bg-panel p-5 shadow-floating sm:p-6">
              <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Personal Preferences</h2>
              <div className="mt-5 space-y-4">
                <label className="block">
                  <FieldLabel>Likes</FieldLabel>
                  <textarea name="likes" value={formData.likes} onChange={handleChange} rows={4} className="mt-2 w-full resize-none rounded-lg bg-background px-4 py-3 shadow-recessed outline-none focus:ring-2 focus:ring-accent/40" required />
                </label>
                <label className="block">
                  <FieldLabel>Dislikes</FieldLabel>
                  <textarea name="dislikes" value={formData.dislikes} onChange={handleChange} rows={4} className="mt-2 w-full resize-none rounded-lg bg-background px-4 py-3 shadow-recessed outline-none focus:ring-2 focus:ring-accent/40" required />
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-panel p-5 shadow-floating sm:p-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Personal Life</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="block">
                <FieldLabel>Relationship Status</FieldLabel>
                <select name="relationshipStatus" value={formData.relationshipStatus} onChange={handleChange} className="mt-2 h-12 w-full rounded-lg bg-background px-4 shadow-recessed outline-none focus:ring-2 focus:ring-accent/40" required>
                  <option value="">Select status</option>
                  {relationshipOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="block">
                <FieldLabel>Working Hours per Day</FieldLabel>
                <input name="workingHours" type="number" min="0" max="24" step="0.5" value={formData.workingHours} onChange={handleChange} className="mt-2 h-12 w-full rounded-lg bg-background px-4 shadow-recessed outline-none focus:ring-2 focus:ring-accent/40" required />
              </label>
              <label className="block">
                <FieldLabel>Sleep Hours</FieldLabel>
                <input name="sleepHours" type="number" min="0" max="24" step="0.5" value={formData.sleepHours} onChange={handleChange} className="mt-2 h-12 w-full rounded-lg bg-background px-4 shadow-recessed outline-none focus:ring-2 focus:ring-accent/40" required />
              </label>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {savedJson && (
            <pre className="max-h-52 overflow-auto rounded-lg bg-foreground p-4 text-xs text-background">
              {JSON.stringify(savedJson, null, 2)}
            </pre>
          )}

          <button type="submit" disabled={isLoading} className="h-12 w-full rounded-lg bg-accent px-6 font-bold uppercase tracking-widest text-white shadow-floating transition disabled:opacity-60 sm:w-auto">
            {isLoading ? "Saving Profile..." : "Save Profile"}
          </button>
        </form>
      </section>
    </main>
  );
}
