"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Expert, Company } from "@/types";

interface IntroRequestDialogProps {
  expert: Expert | null;
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IntroRequestDialog({
  expert,
  company,
  open,
  onOpenChange,
}: IntroRequestDialogProps) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function handleSend() {
    setSent(true);
    setTimeout(() => {
      onOpenChange(false);
      setSent(false);
      setMessage("");
    }, 1500);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setSent(false);
      setMessage("");
    }
    onOpenChange(next);
  }

  if (!expert) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Request Introduction to {expert.firstName} {expert.lastName}
          </DialogTitle>
          <DialogDescription>
            {expert.title} at {company?.name ?? "their organization"}
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="py-6 text-center">
            <p className="text-sm font-medium text-emerald-600">
              Introduction request sent!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You&apos;ll be notified when they respond.
            </p>
          </div>
        ) : (
          <>
            <Textarea
              placeholder="Introduce yourself and explain why you'd like to connect..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
            <DialogFooter>
              <Button
                onClick={handleSend}
                disabled={message.trim().length === 0}
              >
                Send Request
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
