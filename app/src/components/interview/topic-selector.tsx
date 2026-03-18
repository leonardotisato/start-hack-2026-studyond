"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Topic, Company, Field } from "@/types";

interface TopicSelectorProps {
  topics: Topic[];
  companies: Company[];
  fields: Field[];
  selectedTopicId: string | null;
  onSelectTopic: (topicId: string) => void;
}

export function TopicSelector({
  topics,
  companies,
  fields,
  selectedTopicId,
  onSelectTopic,
}: TopicSelectorProps) {
  const [search, setSearch] = useState("");
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  const companyMap = useMemo(
    () => new Map(companies.map((c) => [c.id, c])),
    [companies]
  );
  const fieldMap = useMemo(
    () => new Map(fields.map((f) => [f.id, f])),
    [fields]
  );

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return topics.filter((t) => {
      if (query && !t.title.toLowerCase().includes(query)) return false;
      if (selectedFieldId && !t.fieldIds.includes(selectedFieldId)) return false;
      return true;
    });
  }, [topics, search, selectedFieldId]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Search roles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <select
          value={selectedFieldId ?? ""}
          onChange={(e) => setSelectedFieldId(e.target.value || null)}
          className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm"
        >
          <option value="">All fields</option>
          {fields.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
        {filtered.map((topic) => {
          const company = topic.companyId
            ? companyMap.get(topic.companyId)
            : null;
          const topicFields = topic.fieldIds
            .map((id) => fieldMap.get(id))
            .filter((f): f is Field => f != null);
          const isSelected = topic.id === selectedTopicId;

          return (
            <Card
              key={topic.id}
              className={`cursor-pointer transition hover:bg-accent ${
                isSelected ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => onSelectTopic(topic.id)}
            >
              <CardHeader className="pb-1">
                <CardTitle className="text-sm">{topic.title}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {company?.name ?? "Unknown"}
                  {topic.employmentType &&
                    ` · ${topic.employmentType.replace("_", " ")}`}
                  {topic.workplaceType && ` · ${topic.workplaceType.replace("_", " ")}`}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1">
                  {topic.degrees.map((d) => (
                    <Badge key={d} variant="secondary" className="text-xs">
                      {d.toUpperCase()}
                    </Badge>
                  ))}
                  {topicFields.map((f) => (
                    <Badge key={f.id} variant="outline" className="text-xs">
                      {f.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No roles match your search.
          </p>
        )}
      </div>
    </div>
  );
}
