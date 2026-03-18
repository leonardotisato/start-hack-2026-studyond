"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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

      if (!res.ok) {
        throw new Error("Failed to generate suggestions");
      }

      const data = await res.json();
      setSuggestions(data.suggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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

  const sections = suggestions ? parseSections(suggestions) : [];

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            Conversation Starters
          </SheetTitle>
          <SheetDescription>
            AI-generated icebreakers for connecting with{" "}
            {expert?.firstName} {expert?.lastName}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-4">
          {loading && (
            <div className="py-12 text-center">
              <div className="inline-block size-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                Generating conversation starters...
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={fetchSuggestions}
              >
                Try again
              </Button>
            </div>
          )}

          {sections.map((section, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {section.content.split("\n").filter(Boolean).map((line, j) => {
                    const trimmed = line.replace(/^[-*]\s*/, "").trim();
                    if (!trimmed) return null;
                    const globalIdx = i * 100 + j;
                    return (
                      <div
                        key={j}
                        className="group flex items-start gap-2 rounded-md p-2 hover:bg-muted/50"
                      >
                        <p className="flex-1 text-sm">{trimmed}</p>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="opacity-0 group-hover:opacity-100 shrink-0"
                          onClick={() => handleCopy(trimmed, globalIdx)}
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
              </CardContent>
            </Card>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
