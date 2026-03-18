"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PrepGuideProps {
  guide: string | null;
  loading: boolean;
  error: string | null;
  topicTitle: string;
  companyName: string | null;
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

export function PrepGuide({
  guide,
  loading,
  error,
  topicTitle,
  companyName,
}: PrepGuideProps) {
  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block size-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">
          Generating your preparation guide for{" "}
          <span className="font-medium text-foreground">{topicTitle}</span>
          {companyName && (
            <>
              {" "}at{" "}
              <span className="font-medium text-foreground">{companyName}</span>
            </>
          )}
          ...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">
          Select a role to generate your AI-powered preparation guide.
        </p>
      </div>
    );
  }

  const sections = parseSections(guide);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        Prep Guide: {topicTitle}
        {companyName && (
          <span className="text-muted-foreground font-normal">
            {" "}at {companyName}
          </span>
        )}
      </h2>
      {sections.map((section, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-sm whitespace-pre-line">
              {section.content}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
