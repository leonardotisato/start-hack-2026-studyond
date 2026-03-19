"use client";

import { useState, useMemo, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TopicSelector } from "@/components/orientation/topic-selector";
import { ChatPanel } from "@/components/orientation/chat-panel";
import { OrientationDoc } from "@/components/orientation/orientation-doc";
import type { Topic, Company, Field, Student } from "@/types";

interface OrientationViewProps {
  topics: Topic[];
  companies: Company[];
  fields: Field[];
  student: Student;
  studentFields: Field[];
}

export function OrientationView({
  topics,
  companies,
  fields,
  student,
  studentFields,
}: OrientationViewProps) {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [doc, setDoc] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("chat");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);

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
      setDoc(null);
      setDocError(null);
      setDocLoading(true);
      setActiveTab("doc");

      const topic = topics.find((t) => t.id === topicId);
      if (!topic) return;

      const company = topic.companyId
        ? companyMap.get(topic.companyId) ?? null
        : null;
      const topicFields = topic.fieldIds
        .map((id) => fieldMap.get(id)?.name)
        .filter((n): n is string => n != null);

      const relatedTopics = topics
        .filter(
          (t) =>
            t.id !== topicId &&
            t.fieldIds.some((fid) => topic.fieldIds.includes(fid))
        )
        .slice(0, 5)
        .map((t) => ({ id: t.id, title: t.title, type: t.type }));

      try {
        const res = await fetch("/api/orientation-doc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            company,
            student: {
              skills: student.skills,
              degree: student.degree,
              objectives: student.objectives,
              about: student.about,
            },
            studentFields: studentFields.map((f) => f.name),
            topicFields,
            relatedTopics,
          }),
        });

        if (!res.ok) throw new Error("Failed to generate orientation guide");

        const data = await res.json();
        setDoc(data.guide);
      } catch (err) {
        setDocError(
          err instanceof Error ? err.message : "Something went wrong"
        );
      } finally {
        setDocLoading(false);
      }
    },
    [topics, companyMap, fieldMap, student, studentFields]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <div>
        <h2 className="text-sm font-medium mb-3 text-muted-foreground">
          Browse topics
        </h2>
        <TopicSelector
          topics={topics}
          companies={companies}
          fields={fields}
          selectedTopicId={selectedTopicId}
          onSelectTopic={handleSelectTopic}
          onSearchChange={setSearchQuery}
          onFieldFilterChange={setSelectedFieldIds}
        />
      </div>

      <div className="min-h-[600px] border rounded-lg flex flex-col">
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as string)}
          className="flex flex-col h-full"
        >
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="doc">Orientation Doc</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col min-h-0">
            <ChatPanel
              student={student}
              fieldIds={selectedFieldIds}
              searchQuery={searchQuery}
              onSelectTopic={handleSelectTopic}
            />
          </TabsContent>

          <TabsContent value="doc" className="flex-1 overflow-y-auto">
            <OrientationDoc
              doc={doc}
              loading={docLoading}
              error={docError}
              topicTitle={selectedTopic?.title ?? ""}
              companyName={selectedCompany?.name ?? null}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
