"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { MutualConnection } from "@/lib/mock-connections";
import type { Expert, Company } from "@/types";

interface IntroRequestDialogProps {
  expert: Expert | null;
  company: Company | null;
  mutualConnections: MutualConnection[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function buildTemplate(
  connectionName: string,
  expertFirstName: string,
  expertLastName: string,
  context: string
): string {
  return `Hey ${connectionName},

I saw that we both know ${expertFirstName} ${expertLastName} — I noticed your connection through ${context}.

I'd love to be introduced to them! Would you be up for a quick coffee chat so I can hear about your experience working with them and get some advice before reaching out?

Thanks so much!`;
}

export function IntroRequestDialog({
  expert,
  company,
  mutualConnections,
  open,
  onOpenChange,
}: IntroRequestDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const selected =
    mutualConnections.find((c) => c.id === selectedId) ??
    mutualConnections[0] ??
    null;

  // Auto-fill template when selection or expert changes
  useEffect(() => {
    if (!selected || !expert) return;
    const firstName = selected.name.split(" ")[0];
    setMessage(
      buildTemplate(firstName, expert.firstName, expert.lastName, selected.context)
    );
  }, [selected?.id, expert?.id]);

  function handleSend() {
    setSent(true);
    setTimeout(() => {
      onOpenChange(false);
      setSent(false);
      setMessage("");
      setSelectedId(null);
    }, 1800);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setSent(false);
      setMessage("");
      setSelectedId(null);
    }
    onOpenChange(next);
  }

  if (!expert) return null;

  const roleLabel: Record<string, string> = {
    student: "Student",
    alumni: "Alumni",
    supervisor: "Supervisor",
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Request Introduction to {expert.firstName} {expert.lastName}
          </DialogTitle>
          <DialogDescription>
            {expert.title} · {company?.name ?? "Independent"}
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="py-8 text-center space-y-1">
            <p className="text-sm font-medium text-emerald-600">Message sent!</p>
            <p className="text-xs text-muted-foreground">
              {selected?.name} will be notified to make the introduction.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                Ask via mutual connection
              </p>
              <div className="space-y-2">
                {mutualConnections.map((conn) => (
                  <button
                    key={conn.id}
                    type="button"
                    onClick={() => setSelectedId(conn.id)}
                    className={`w-full text-left rounded-lg border p-3 transition hover:bg-accent ${
                      (selectedId ?? mutualConnections[0]?.id) === conn.id
                        ? "border-primary bg-accent"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium flex-1">{conn.name}</p>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {roleLabel[conn.role]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {conn.context}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                Your message
              </p>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={7}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Feel free to edit before sending.
              </p>
            </div>

            <DialogFooter>
              <Button
                onClick={handleSend}
                disabled={message.trim().length === 0}
              >
                Send Message
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
