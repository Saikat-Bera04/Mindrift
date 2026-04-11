"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PhysicalButton } from "@/components/ui/mechanics";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getBackendOrigin } from "@/lib/backend-url";

export type ManualActivity = {
  id: string;
  type: string;
  title: string;
  duration?: number;
  notes?: string;
  intensity?: string;
  date: string;
};

export function ManualEntryForm({ onCreated }: { onCreated?: (activity: ManualActivity) => void }) {
  const { getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: "meditation",
    title: "",
    duration: "",
    intensity: "",
    notes: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const submit = async () => {
    setError("");
    if (!form.type || !form.title.trim()) {
      setError("Choose a type and add a title.");
      return;
    }

    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in again.");

      const response = await fetch(`${getBackendOrigin()}/activity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: form.type,
          title: form.title.trim(),
          duration: form.duration ? Number(form.duration) : undefined,
          intensity: form.intensity || undefined,
          notes: form.notes.trim() || undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to save activity.");

      onCreated?.(data.activity);
      setForm({ type: "meditation", title: "", duration: "", intensity: "", notes: "" });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save activity.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <PhysicalButton className="h-12 px-6 flex gap-2 items-center shrink-0">
          <Plus className="w-4 h-4" />
          <span className="text-xs uppercase font-bold tracking-widest">Manual Data</span>
        </PhysicalButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] bg-background border-[#ffffff] shadow-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold uppercase tracking-widest text-foreground">Add Activity</DialogTitle>
        </DialogHeader>
        <div className="grid gap-5 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <select name="type" value={form.type} onChange={update} className="h-10 w-full rounded-md bg-panel px-3 shadow-recessed border border-[#ffffff] outline-none">
                <option value="meditation">Meditation</option>
                <option value="journal">Journal</option>
                <option value="exercise">Exercise</option>
                <option value="breathing">Breathing</option>
                <option value="sleep">Sleep</option>
                <option value="mood">Mood</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input name="duration" type="number" min="0" value={form.duration} onChange={update} placeholder="30" className="bg-panel shadow-recessed border border-[#ffffff]" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input name="title" value={form.title} onChange={update} placeholder="Evening walk, study session, sleep log..." className="bg-panel shadow-recessed border border-[#ffffff]" />
          </div>

          <div className="space-y-2">
            <Label>Intensity / Quality</Label>
            <Input name="intensity" value={form.intensity} onChange={update} placeholder="Low, medium, high, 8/10..." className="bg-panel shadow-recessed border border-[#ffffff]" />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <textarea name="notes" value={form.notes} onChange={update} rows={4} placeholder="Add context, feelings, triggers, or observations." className="w-full resize-none rounded-md bg-panel px-3 py-2 shadow-recessed border border-[#ffffff] outline-none" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button onClick={submit} disabled={isSaving} className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-bold tracking-widest uppercase shadow-floating">
            {isSaving ? "Saving..." : "Save to Neon"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
