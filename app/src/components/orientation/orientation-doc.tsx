"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OrientationDocProps {
  doc: string | null;
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

function CollapsibleCard({ title, content }: Section) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader
        className="pb-2 cursor-pointer select-none"
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{title}</CardTitle>
          <span className="text-muted-foreground text-xs">
            {open ? "−" : "+"}
          </span>
        </div>
      </CardHeader>
      {open && (
        <CardContent>
          <div className="prose prose-sm max-w-none text-sm">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export function OrientationDoc({
  doc,
  loading,
  error,
  topicTitle,
  companyName,
}: OrientationDocProps) {
  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block size-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">
          Generating orientation guide for{" "}
          <span className="font-medium text-foreground">{topicTitle}</span>
          {companyName && (
            <>
              {" "}
              at{" "}
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

  if (!doc) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">
          Select a topic or ask the chat for recommendations.
        </p>
      </div>
    );
  }

  const sections = parseSections(doc);
  const summary = sections.find((s) => s.title.toLowerCase() === "summary");
  const rest = sections.filter((s) => s.title.toLowerCase() !== "summary");

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-semibold">
        {topicTitle}
        {companyName && (
          <span className="text-muted-foreground font-normal">
            {" "}
            at {companyName}
          </span>
        )}
      </h2>
      {summary && (
        <p className="text-sm text-muted-foreground">{summary.content}</p>
      )}
      {rest.map((section, i) => (
        <CollapsibleCard
          key={i}
          title={section.title}
          content={section.content}
        />
      ))}
    </div>
  );
}
