"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Topic, Company, Field, TopicType } from "@/types";

type TypeFilter = "all" | TopicType;

interface TopicSelectorProps {
  topics: Topic[];
  companies: Company[];
  fields: Field[];
  selectedTopicId: string | null;
  onSelectTopic: (topicId: string) => void;
  onSearchChange?: (query: string) => void;
  onFieldFilterChange?: (fieldIds: string[]) => void;
}

export function TopicSelector({
  topics,
  companies,
  fields,
  selectedTopicId,
  onSelectTopic,
  onSearchChange,
  onFieldFilterChange,
}: TopicSelectorProps) {
  const [search, setSearch] = useState("");
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

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
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      return true;
    });
  }, [topics, search, selectedFieldId, typeFilter]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearchChange?.(value);
  };

  const handleFieldChange = (value: string | null) => {
    setSelectedFieldId(value);
    onFieldFilterChange?.(value ? [value] : []);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Search topics..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1"
        />
        <select
          value={selectedFieldId ?? ""}
          onChange={(e) => handleFieldChange(e.target.value || null)}
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

      <div className="flex gap-1">
        {(["all", "topic", "job"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              typeFilter === t
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "all" ? "All" : t === "topic" ? "Thesis" : "Job"}
          </button>
        ))}
      </div>

      <div className="space-y-2 max-h-[calc(100vh-340px)] overflow-y-auto">
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
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm">{topic.title}</CardTitle>
                  <Badge
                    variant={topic.type === "job" ? "default" : "secondary"}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {topic.type === "job" ? "Job" : "Thesis"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {company?.name ?? "University"}
                  {topic.employmentType &&
                    ` · ${topic.employmentType.replace("_", " ")}`}
                  {topic.workplaceType &&
                    ` · ${topic.workplaceType.replace("_", " ")}`}
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
            No topics match your search.
          </p>
        )}
      </div>
    </div>
  );
}
