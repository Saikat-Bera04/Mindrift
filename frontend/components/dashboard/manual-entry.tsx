"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PhysicalButton } from "@/components/ui/mechanics";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ManualEntryForm() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"sleep" | "exercise">("sleep");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <PhysicalButton className="h-12 px-6 flex gap-2 items-center shrink-0">
          <Plus className="w-4 h-4" />
          <span className="text-xs uppercase font-bold tracking-widest">Manual Data</span>
        </PhysicalButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-background border-[#ffffff] shadow-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold uppercase tracking-widest text-foreground">Manual Override</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="flex bg-panel rounded-lg p-1 shadow-recessed">
            <button
              onClick={() => setType('sleep')}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${type === 'sleep' ? 'bg-background shadow-floating text-accent' : 'text-muted-fg'}`}
            >
              Sleep
            </button>
            <button
              onClick={() => setType('exercise')}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${type === 'exercise' ? 'bg-background shadow-floating text-accent' : 'text-muted-fg'}`}
            >
              Exercise
            </button>
          </div>

          <div className="space-y-4">
            {type === 'sleep' ? (
              <>
                <div className="space-y-2">
                  <Label>Duration (Hours)</Label>
                  <Input type="number" placeholder="8" className="bg-panel shadow-recessed border border-[#ffffff]" />
                </div>
                <div className="space-y-2">
                  <Label>Quality (1-10)</Label>
                  <Input type="number" placeholder="7" min="1" max="10" className="bg-panel shadow-recessed border border-[#ffffff]" />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Activity Type</Label>
                  <Input type="text" placeholder="Running, Yoga, etc." className="bg-panel shadow-recessed border border-[#ffffff]" />
                </div>
                <div className="space-y-2">
                  <Label>Duration (Minutes)</Label>
                  <Input type="number" placeholder="45" className="bg-panel shadow-recessed border border-[#ffffff]" />
                </div>
              </>
            )}
          </div>
          <Button onClick={() => setOpen(false)} className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-bold tracking-widest uppercase shadow-floating">
            Submit Log
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
