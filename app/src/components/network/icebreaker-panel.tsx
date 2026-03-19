"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Expert, Company, Student, Field } from "@/types";

interface IcebreakerPanelProps {
  expert: Expert | null;
  company: Company | null;
  student: Student;
  studentFields: Field[];
  expertFields: Field[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Section {
  title: string;
  content: string;
}

const SECTIONS: { title: string; skeletonWidths: string[] }[] = [
  { title: "Icebreakers", skeletonWidths: ["w-full", "w-5/6"] },
  { title: "Questions to Ask", skeletonWidths: ["w-full", "w-4/5", "w-11/12"] },
  { title: "Common Ground", skeletonWidths: ["w-3/4"] },
];

function parseSections(markdown: string): Section[] {
  const parts = markdown.split(/^## /m).filter(Boolean);
  return parts.map((part) => {
    const newlineIdx = part.indexOf("\n");
    return {
      title: newlineIdx >= 0 ? part.slice(0, newlineIdx).trim() : part.trim(),
      content: newlineIdx >= 0 ? part.slice(newlineIdx + 1).trim() : "",
    };
  });
}

function SectionSkeleton({ widths }: { widths: string[] }) {
  return (
    <div className="space-y-3">
      {widths.map((w, i) => (
        <div key={i} className="flex items-start gap-2 p-2">
          <div className={`h-3.5 ${w} rounded bg-muted animate-pulse`} />
        </div>
      ))}
    </div>
  );
}

export function IcebreakerPanel({
  expert,
  company,
  student,
  studentFields,
  expertFields,
  open,
  onOpenChange,
}: IcebreakerPanelProps) {
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const fetchSuggestions = useCallback(async () => {
    if (!expert) return;
    setLoading(true);
    setError(null);
    setSuggestions(null);

    try {
      const res = await fetch("/api/icebreaker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student: {
            name: `${student.firstName} ${student.lastName}`,
            skills: student.skills,
            fields: studentFields.map((f) => f.name),
            degree: student.degree,
            about: student.about,
          },
          expert: {
            name: `${expert.firstName} ${expert.lastName}`,
            title: expert.title,
            company: company?.name ?? null,
            fields: expertFields.map((f) => f.name),
            about: expert.about,
            objectives: expert.objectives,
          },
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed to generate suggestions");
      }

      setLoading(false);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setSuggestions(accumulated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, [expert, student, company, studentFields, expertFields]);

  useEffect(() => {
    if (open && expert && !suggestions && !loading) {
      fetchSuggestions();
    }
  }, [open, expert, suggestions, loading, fetchSuggestions]);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setSuggestions(null);
      setCopiedIdx(null);
    }
    onOpenChange(next);
  }

  async function handleCopy(text: string, idx: number) {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  const parsedSections = suggestions ? parseSections(suggestions) : [];
  const sectionMap = new Map(parsedSections.map((s) => [s.title, s]));
  const isStreaming = loading || (suggestions !== null);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Conversation Starters</DialogTitle>
          <DialogDescription>
            AI-generated icebreakers for connecting with {expert?.firstName}{" "}
            {expert?.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
              <Button
                variant="outline"
                size="sm"
                className="mt-2 block"
                onClick={fetchSuggestions}
              >
                Try again
              </Button>
            </div>
          )}

          {(isStreaming || parsedSections.length > 0) &&
            SECTIONS.map(({ title, skeletonWidths }, i) => {
              const section = sectionMap.get(title);
              const lines = section
                ? section.content
                    .split("\n")
                    .map((l) => l.replace(/^[-*]\s*/, "").trim())
                    .filter(Boolean)
                : [];
              const hasContent = lines.length > 0;

              return (
                <Card key={title}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {hasContent ? (
                      <div className="space-y-2">
                        {lines.map((line, j) => {
                          const globalIdx = i * 100 + j;
                          return (
                            <div
                              key={j}
                              className="group flex items-start gap-2 rounded-md p-2 hover:bg-muted/50"
                            >
                              <p className="flex-1 text-sm">{line}</p>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className="opacity-0 group-hover:opacity-100 shrink-0"
                                onClick={() => handleCopy(line, globalIdx)}
                              >
                                {copiedIdx === globalIdx ? (
                                  <span className="text-xs">&#10003;</span>
                                ) : (
                                  <span className="text-xs">&#9776;</span>
                                )}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <SectionSkeleton widths={skeletonWidths} />
                    )}
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
