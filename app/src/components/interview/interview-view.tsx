"use client";

import { useState, useMemo, useCallback } from "react";
import { TopicSelector } from "@/components/interview/topic-selector";
import { PrepGuide } from "@/components/interview/prep-guide";
import type { Topic, Company, Field, Student } from "@/types";

interface InterviewViewProps {
  topics: Topic[];
  companies: Company[];
  fields: Field[];
  student: Student;
  studentFields: Field[];
}

export function InterviewView({
  topics,
  companies,
  fields,
  student,
  studentFields,
}: InterviewViewProps) {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [guide, setGuide] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const companyMap = useMemo(
    () => new Map(companies.map((c) => [c.id, c])),
    [companies]
  );
  const fieldMap = useMemo(
    () => new Map(fields.map((f) => [f.id, f])),
    [fields]
  );

  const selectedTopic = topics.find((t) => t.id === selectedTopicId) ?? null;
  const selectedCompany = selectedTopic?.companyId
    ? companyMap.get(selectedTopic.companyId) ?? null
    : null;

  const handleSelectTopic = useCallback(
    async (topicId: string) => {
      setSelectedTopicId(topicId);
      setGuide(null);
      setError(null);
      setLoading(true);

      const topic = topics.find((t) => t.id === topicId);
      if (!topic) return;

      const company = topic.companyId
        ? companyMap.get(topic.companyId) ?? null
        : null;
      const topicFields = topic.fieldIds
        .map((id) => fieldMap.get(id)?.name)
        .filter((n): n is string => n != null);

      try {
        const res = await fetch("/api/interview-prep", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            company,
            studentSkills: student.skills,
            studentFields: studentFields.map((f) => f.name),
            topicFields,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to generate preparation guide");
        }

        const data = await res.json();
        setGuide(data.guide);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [topics, companyMap, fieldMap, student.skills, studentFields]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <div>
        <h2 className="text-sm font-medium mb-3 text-muted-foreground">
          Select a role
        </h2>
        <TopicSelector
          topics={topics}
          companies={companies}
          fields={fields}
          selectedTopicId={selectedTopicId}
          onSelectTopic={handleSelectTopic}
        />
      </div>
      <div>
        <PrepGuide
          guide={guide}
          loading={loading}
          error={error}
          topicTitle={selectedTopic?.title ?? ""}
          companyName={selectedCompany?.name ?? null}
        />
      </div>
    </div>
  );
}
