"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { notifyAuthChanged } from "@/lib/jwt-auth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MechanicalCard, RecessedInput } from "@/components/ui/mechanics";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Briefcase, Heart, Moon, Sun, User, Stethoscope, Sparkles, RefreshCw } from "lucide-react";

/**
 * Hook to wait for Convex auth to settle after a redirect.
 * After sign-up, the JWT cookie is set but Convex needs time to validate it.
 * This hook polls the auth state and provides retry capability.
 */
function useWaitForAuth() {
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const [timedOut, setTimedOut] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Give Convex up to 12 seconds to settle auth after page load
  useEffect(() => {
    if (isAuthenticated) {
      setTimedOut(false);
      return;
    }

    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        setTimedOut(true);
      }
    }, 12000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, retryCount]);

  const retry = useCallback(() => {
    setTimedOut(false);
    setRetryCount((c) => c + 1);
    // Fire auth-changed event to force useJwtAuth to re-fetch session
    notifyAuthChanged();
  }, []);

  return {
    authLoading,
    isAuthenticated,
    timedOut,
    retry,
    // Auth is "settling" when loading and not yet timed out
    isSettling: authLoading && !isAuthenticated && !timedOut,
  };
}

function calculateBMI(heightCm: number, weightKg: number) {
  if (!heightCm || !weightKg || heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(2));
}

function PersonalForm() {
  const router = useRouter();
  const { authLoading, isAuthenticated, timedOut, retry, isSettling } = useWaitForAuth();
  const saveProfile = useMutation(api.users.mutations.saveOnboardingProfile);
  const [formData, setFormData] = useState({
    height: "", weight: "", bloodPressure: "", age: "",
    status: "", jobDescription: "",
    likes: "", dislikes: "",
    relationshipStatus: "", workingHours: "", sleepHours: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const bmi = useMemo(() => calculateBMI(Number(formData.height), Number(formData.weight)), [formData.height, formData.weight]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (authLoading && !isAuthenticated) {
      setError("Authentication is still loading. Please wait a moment and try again.");
      return;
    }
    if (!isAuthenticated) {
      setError("You need to be signed in. Please go back and sign in, then return here.");
      return;
    }

    setIsLoading(true);
    
    if (!formData.height || !formData.weight || !formData.age) {
        setError("Please fill in all basic health metrics (Age, Height, Weight).");
        setIsLoading(false);
        return;
    }

    try {
      const result = await saveProfile({
        type: "personal",
        age: Number(formData.age),
        height: Number(formData.height),
        weight: Number(formData.weight),
        bmi,
        bloodPressure: formData.bloodPressure || undefined,
        status: formData.status || undefined,
        jobDescription: formData.jobDescription || undefined,
        likes: formData.likes || undefined,
        dislikes: formData.dislikes || undefined,
        relationshipStatus: formData.relationshipStatus || undefined,
        workingHours: formData.workingHours ? Number(formData.workingHours) : undefined,
        sleepHours: formData.sleepHours ? Number(formData.sleepHours) : undefined,
      });
      if (!result?.success) {
        setError("Authentication failed. Please sign in again and retry.");
        setIsLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch (e: any) {
      setError(e.message || "Failed to save data. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto pb-12 animate-[fadeIn_0.5s_ease-out]">
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-sm font-bold font-mono uppercase tracking-wide">
          {error}
        </div>
      )}
      
      <MechanicalCard elevated withVents className="p-8 space-y-6">
        <h3 className="text-xl font-bold uppercase tracking-wider flex items-center gap-3 border-b border-[#ffffff] pb-4 mb-4">
          <Heart className="w-6 h-6 text-accent drop-shadow-sm" /> Basic Health
        </h3>
        <p className="text-sm font-mono text-muted-fg uppercase tracking-wide">Tell us a bit about your physical well-being.</p>
        <div className="grid grid-cols-2 gap-6 mt-6">
           <div className="space-y-2">
             <Label htmlFor="p-age" className="font-bold text-foreground ml-2">Age</Label>
             <RecessedInput id="p-age" type="number" required value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} placeholder="Years" />
           </div>
           <div className="space-y-2">
             <Label htmlFor="p-bp" className="font-bold text-foreground ml-2">Blood Pressure</Label>
             <RecessedInput id="p-bp" type="text" value={formData.bloodPressure} onChange={e => setFormData({...formData, bloodPressure: e.target.value})} placeholder="e.g. 120/80" />
           </div>
           <div className="space-y-2">
             <Label htmlFor="p-height" className="font-bold text-foreground ml-2">Height (cm)</Label>
             <RecessedInput id="p-height" type="number" required value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} placeholder="175" />
           </div>
           <div className="space-y-2">
             <Label htmlFor="p-weight" className="font-bold text-foreground ml-2">Weight (kg)</Label>
             <RecessedInput id="p-weight" type="number" required value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} placeholder="70" />
           </div>
           <div className="col-span-2 space-y-2 pt-2">
             <Label className="font-bold text-foreground ml-2">Auto-Calculated BMI</Label>
             <div className="h-14 w-full rounded-xl bg-background shadow-recessed border-none px-6 flex items-center text-accent font-mono font-bold tracking-wider">
               {bmi > 0 ? bmi : "--.--"} 
               {bmi > 0 && <span className="ml-2 text-muted-fg">({bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese"})</span>}
             </div>
           </div>
        </div>
      </MechanicalCard>

      <MechanicalCard elevated className="p-8 space-y-6">
        <h3 className="text-xl font-bold uppercase tracking-wider flex items-center gap-3 border-b border-[#ffffff] pb-4 mb-4">
          <Sun className="w-6 h-6 text-accent drop-shadow-sm" /> Lifestyle
        </h3>
        <div className="space-y-6">
           <div className="space-y-2">
             <Label className="font-bold text-foreground ml-2">Current Status</Label>
             <Select onValueChange={v => setFormData({...formData, status: v})}>
                <SelectTrigger className="h-14 rounded-xl bg-background shadow-recessed border-none px-6 focus:ring-2 focus:ring-accent/50 outline-none"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent className="bg-panel border-[#ffffff]">
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Employee">Employee</SelectItem>
                  <SelectItem value="Worker">Worker</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
             </Select>
           </div>
           <div className="space-y-2">
             <Label className="font-bold text-foreground ml-2">Job / Study Description</Label>
             <Textarea className="min-h-[120px] rounded-xl bg-background shadow-recessed border-none px-6 py-4 focus-visible:ring-accent/50 text-foreground resize-none" placeholder="Briefly describe what you do..." value={formData.jobDescription} onChange={e => setFormData({...formData, jobDescription: e.target.value})} />
           </div>
        </div>
      </MechanicalCard>

      <MechanicalCard elevated className="p-8 space-y-6">
        <h3 className="text-xl font-bold uppercase tracking-wider flex items-center gap-3 border-b border-[#ffffff] pb-4 mb-4">
          <User className="w-6 h-6 text-accent drop-shadow-sm" /> Personal Preferences
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-2">
             <Label className="font-bold text-foreground ml-2">Likes</Label>
             <Textarea className="min-h-[120px] rounded-xl bg-background shadow-recessed border-none px-6 py-4 focus-visible:ring-accent/50 text-foreground resize-none" placeholder="What brings you joy?" value={formData.likes} onChange={e => setFormData({...formData, likes: e.target.value})} />
           </div>
           <div className="space-y-2">
             <Label className="font-bold text-foreground ml-2">Dislikes</Label>
             <Textarea className="min-h-[120px] rounded-xl bg-background shadow-recessed border-none px-6 py-4 focus-visible:ring-accent/50 text-foreground resize-none" placeholder="What stresses you out?" value={formData.dislikes} onChange={e => setFormData({...formData, dislikes: e.target.value})} />
           </div>
        </div>
      </MechanicalCard>

      <MechanicalCard elevated className="p-8 space-y-6">
        <h3 className="text-xl font-bold uppercase tracking-wider flex items-center gap-3 border-b border-[#ffffff] pb-4 mb-4">
          <Moon className="w-6 h-6 text-accent drop-shadow-sm" /> Personal Life
        </h3>
        <div className="space-y-6">
           <div className="space-y-2">
             <Label className="font-bold text-foreground ml-2">Relationship Status</Label>
             <Select onValueChange={v => setFormData({...formData, relationshipStatus: v})}>
                <SelectTrigger className="h-14 rounded-xl bg-background shadow-recessed border-none px-6 focus:ring-2 focus:ring-accent/50 outline-none"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent className="bg-panel border-[#ffffff]">
                  <SelectItem value="Single">Single</SelectItem>
                  <SelectItem value="In a Relationship">In a Relationship</SelectItem>
                  <SelectItem value="Complicated">Complicated</SelectItem>
                  <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                </SelectContent>
             </Select>
           </div>
           <div className="grid grid-cols-2 gap-6">
             <div className="space-y-2">
               <Label className="font-bold text-foreground ml-2">Working Hrs / Day</Label>
               <RecessedInput type="number" value={formData.workingHours} onChange={e => setFormData({...formData, workingHours: e.target.value})} placeholder="e.g. 8" />
             </div>
             <div className="space-y-2">
               <Label className="font-bold text-foreground ml-2">Sleep Hrs / Night</Label>
               <RecessedInput type="number" value={formData.sleepHours} onChange={e => setFormData({...formData, sleepHours: e.target.value})} placeholder="e.g. 7" />
             </div>
           </div>
        </div>
        <div className="pt-8 space-y-3">
          {/* Auth settling indicator */}
          {isSettling && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 text-xs font-bold font-mono uppercase tracking-wide flex items-center gap-2 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Synchronizing authentication... Please wait
            </div>
          )}
          {/* Timed out — show retry */}
          {timedOut && !isAuthenticated && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs font-bold font-mono uppercase tracking-wide flex items-center justify-between">
              <span>Authentication sync failed.</span>
              <button type="button" onClick={retry} className="underline hover:text-red-800 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}
          <div className="flex justify-end">
            <button type="submit" disabled={isLoading || isSettling || (!isAuthenticated && !timedOut)}
               className="relative font-bold uppercase tracking-widest rounded-xl transition-all duration-150 active:translate-y-[2px] min-h-[56px] px-8 flex items-center justify-center gap-2 bg-accent text-white shadow-[4px_4px_8px_rgba(166,50,60,0.4),-4px_-4px_8px_rgba(255,100,110,0.4)] active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.2)] border border-white/20 hover:brightness-110 w-full sm:w-auto overflow-hidden disabled:opacity-50">
              {isSettling ? "Authenticating..." : isLoading ? "Saving to Database..." : "Boot Subsystem"}
              {!isLoading && !isSettling && <Sparkles className="w-5 h-5 ml-2" />}
            </button>
          </div>
        </div>
      </MechanicalCard>
    </form>
  )
}

function ProfessionalForm() {
  const router = useRouter();
  const { authLoading, isAuthenticated, timedOut, retry, isSettling } = useWaitForAuth();
  const saveProfile = useMutation(api.users.mutations.saveOnboardingProfile);
  const [formData, setFormData] = useState({
    age: "", height: "", weight: "", blood_pressure: "",
    status: "", job_description: "",
    likes: "", dislikes: "",
    relationship_status: "", working_hours: "", sleep_hours: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const bmi = useMemo(() => calculateBMI(Number(formData.height), Number(formData.weight)), [formData.height, formData.weight]);

  const validate = () => {
    let currErrors: Record<string, string> = {};
    if (!formData.age) currErrors.age = "Age is required";
    if (!formData.height) currErrors.height = "Height is required";
    if (!formData.weight) currErrors.weight = "Weight is required";
    if (!formData.job_description) currErrors.job_description = "Job description is required";
    if (!formData.likes) currErrors.likes = "Required field";
    if (!formData.dislikes) currErrors.dislikes = "Required field";
    setErrors(currErrors);
    return Object.keys(currErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authLoading && !isAuthenticated) {
      setSubmitError("Authentication is still loading. Please wait a moment and try again.");
      return;
    }
    if (!isAuthenticated) {
      setSubmitError("You need to be signed in. Please go back and sign in, then return here.");
      return;
    }
    if (!validate()) return;
    setSubmitError("");
    setIsLoading(true);

    try {
      const result = await saveProfile({
        type: "professional",
        age: Number(formData.age),
        height: Number(formData.height),
        weight: Number(formData.weight),
        bmi,
        bloodPressure: formData.blood_pressure || undefined,
        status: formData.status || undefined,
        jobDescription: formData.job_description || undefined,
        likes: formData.likes || undefined,
        dislikes: formData.dislikes || undefined,
        relationshipStatus: formData.relationship_status || undefined,
        workingHours: formData.working_hours ? Number(formData.working_hours) : undefined,
        sleepHours: formData.sleep_hours ? Number(formData.sleep_hours) : undefined,
      });
      if (!result?.success) {
        setSubmitError("Authentication failed. Please sign in again and retry.");
        setIsLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch (e: any) {
      setSubmitError(e.message || "Failed to save. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-12 max-w-3xl mx-auto pb-12 animate-[fadeIn_0.5s_ease-out]">
      {submitError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-sm font-bold font-mono uppercase tracking-wide">
          {submitError}
        </div>
      )}
      <MechanicalCard elevated withScrews className="p-10 space-y-10">
        <div>
          <h3 className="text-xl font-bold uppercase tracking-widest flex items-center gap-3 border-b border-[#ffffff] pb-4 mb-6 text-foreground">
            <Stethoscope className="w-6 h-6 text-accent drop-shadow-[0_0_4px_rgba(255,71,87,0.4)]" /> Demographics & Health Metrics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="pro-age" className="font-bold ml-2">Age <span className="text-accent">*</span></Label>
              <RecessedInput id="pro-age" type="number" required value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className={errors.age ? 'ring-2 ring-accent/50' : ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pro-height" className="font-bold ml-2">Height (cm) <span className="text-accent">*</span></Label>
              <RecessedInput id="pro-height" type="number" required value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className={errors.height ? 'ring-2 ring-accent/50' : ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pro-weight" className="font-bold ml-2">Weight (kg) <span className="text-accent">*</span></Label>
              <RecessedInput id="pro-weight" type="number" required value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className={errors.weight ? 'ring-2 ring-accent/50' : ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pro-bp" className="font-bold ml-2">Blood Pressure (Optional)</Label>
              <RecessedInput id="pro-bp" type="text" value={formData.blood_pressure} onChange={e => setFormData({...formData, blood_pressure: e.target.value})} placeholder="Systolic / Diastolic" />
            </div>
            <div className="col-span-full space-y-2 bg-panel/50 p-6 rounded-2xl shadow-recessed border-t border-muted-bg flex items-center justify-between mt-4">
              <Label className="font-bold text-lg uppercase tracking-wide">Live Body Mass Index</Label>
              <div className="text-2xl font-mono font-bold tracking-tight text-accent flex items-center gap-3">
                {bmi > 0 && <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-glow"></div>}
                {bmi > 0 ? bmi : "[ --.-- ]"}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold uppercase tracking-widest flex items-center gap-3 border-b border-[#ffffff] pb-4 mb-6 text-foreground">
            <Briefcase className="w-6 h-6 text-accent drop-shadow-[0_0_4px_rgba(255,71,87,0.4)]" /> Occupation Context
          </h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="font-bold ml-2">Current Status</Label>
              <Select onValueChange={v => setFormData({...formData, status: v})}>
                <SelectTrigger className="h-14 rounded-xl bg-background shadow-recessed border-none px-6 focus:ring-2 focus:ring-accent/50"><SelectValue placeholder="Select current status" /></SelectTrigger>
                <SelectContent className="bg-panel border-[#ffffff]">
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Employed">Employed</SelectItem>
                  <SelectItem value="Self-employed">Self-employed</SelectItem>
                  <SelectItem value="Unemployed">Unemployed</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-bold ml-2">Job Description <span className="text-accent">*</span></Label>
              <Textarea required value={formData.job_description} onChange={e => setFormData({...formData, job_description: e.target.value})} className={`min-h-[140px] rounded-xl bg-background shadow-recessed border-none px-6 py-4 focus-visible:ring-accent/50 text-foreground resize-none ${errors.job_description ? 'ring-2 ring-accent/50' : ''}`} placeholder="Describe day-to-day responsibilities..." />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold uppercase tracking-widest flex items-center gap-3 border-b border-[#ffffff] pb-4 mb-6 text-foreground">
            <Activity className="w-6 h-6 text-accent drop-shadow-[0_0_4px_rgba(255,71,87,0.4)]" /> Behavioral Targets
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-bold ml-2">Likes <span className="text-accent">*</span></Label>
              <Textarea required value={formData.likes} onChange={e => setFormData({...formData, likes: e.target.value})} className={`min-h-[120px] rounded-xl bg-background shadow-recessed border-none px-6 py-4 focus-visible:ring-accent/50 text-foreground resize-none ${errors.likes ? 'ring-2 ring-accent/50' : ''}`} />
            </div>
            <div className="space-y-2">
              <Label className="font-bold ml-2">Dislikes <span className="text-accent">*</span></Label>
              <Textarea required value={formData.dislikes} onChange={e => setFormData({...formData, dislikes: e.target.value})} className={`min-h-[120px] rounded-xl bg-background shadow-recessed border-none px-6 py-4 focus-visible:ring-accent/50 text-foreground resize-none ${errors.dislikes ? 'ring-2 ring-accent/50' : ''}`} />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold uppercase tracking-widest flex items-center gap-3 border-b border-[#ffffff] pb-4 mb-6 text-foreground">
            <User className="w-6 h-6 text-accent drop-shadow-[0_0_4px_rgba(255,71,87,0.4)]" /> Personal Environment
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="font-bold ml-2">Relationship</Label>
              <Select onValueChange={v => setFormData({...formData, relationship_status: v})}>
                <SelectTrigger className="h-14 rounded-xl bg-background shadow-recessed border-none px-4"><SelectValue placeholder="..." /></SelectTrigger>
                <SelectContent className="bg-panel border-[#ffffff]">
                  <SelectItem value="Single">Single</SelectItem>
                  <SelectItem value="Married">Married</SelectItem>
                  <SelectItem value="In a Relationship">In a Relationship</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-bold ml-2">Avg Working Hrs</Label>
              <RecessedInput type="number" value={formData.working_hours} onChange={e => setFormData({...formData, working_hours: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="font-bold ml-2">Avg Sleep Hrs</Label>
              <RecessedInput type="number" value={formData.sleep_hours} onChange={e => setFormData({...formData, sleep_hours: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-[#ffffff] space-y-3">
          {/* Auth settling indicator */}
          {isSettling && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 text-xs font-bold font-mono uppercase tracking-wide flex items-center gap-2 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Synchronizing authentication... Please wait
            </div>
          )}
          {/* Timed out — show retry */}
          {timedOut && !isAuthenticated && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs font-bold font-mono uppercase tracking-wide flex items-center justify-between">
              <span>Authentication sync failed.</span>
              <button type="button" onClick={retry} className="underline hover:text-red-800 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}
          <div className="flex justify-end">
            <button type="submit" disabled={isLoading || isSettling || (!isAuthenticated && !timedOut)}
               className="relative font-bold uppercase tracking-widest rounded-xl transition-all duration-150 active:translate-y-[2px] min-h-[56px] px-8 flex items-center justify-center gap-2 bg-accent text-white shadow-[4px_4px_8px_rgba(166,50,60,0.4),-4px_-4px_8px_rgba(255,100,110,0.4)] active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.2)] border border-white/20 hover:brightness-110 w-full sm:w-auto disabled:opacity-50">
              {isSettling ? "Authenticating..." : isLoading ? "Executing Pipeline..." : "Commit Setup To Database"}
            </button>
          </div>
        </div>
      </MechanicalCard>
    </form>
  )
}

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-background py-16 px-4 animate-[fadeIn_0.5s_ease-out] relative">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.05)_50%)] bg-[length:100%_4px] mix-blend-overlay"></div>
      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        <div className="text-center space-y-4">
          <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-background shadow-floating mb-4">
            <Activity className="w-8 h-8 text-accent animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter" style={{ textShadow: '0 2px 2px #ffffff' }}>
            Initialize <span className="text-accent">Santulan</span> Baseline
          </h1>
          <p className="text-muted-fg font-mono uppercase tracking-widest text-sm max-w-2xl mx-auto">
            Choose your calibration mode to supply system context matrices.
          </p>
        </div>

        <Tabs defaultValue="personal" className="w-full">
          <div className="flex justify-center mb-10">
            <TabsList className="grid w-full max-w-[500px] grid-cols-2 h-[60px] bg-background shadow-recessed rounded-[20px] p-1.5 border-none">
              <TabsTrigger value="personal" className="rounded-2xl font-bold uppercase tracking-wider text-xs md:text-sm shadow-floating data-[state=active]:bg-panel data-[state=active]:text-accent data-[state=active]:shadow-pressed border border-transparent data-[state=active]:border-[#ffffff] transition-all">
                Personal Pipeline
              </TabsTrigger>
              <TabsTrigger value="professional" className="rounded-2xl font-bold uppercase tracking-wider text-xs md:text-sm shadow-floating data-[state=active]:bg-panel data-[state=active]:text-accent data-[state=active]:shadow-pressed border border-transparent data-[state=active]:border-[#ffffff] transition-all">
                Enterprise Pipeline
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="personal" className="mt-0"><PersonalForm /></TabsContent>
          <TabsContent value="professional" className="mt-0"><ProfessionalForm /></TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
