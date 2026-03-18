"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import type { Field, Company } from "@/types";

export type PersonType = "all" | "experts" | "supervisors";

interface NetworkFiltersProps {
  fields: Field[];
  companies: Company[];
  selectedFieldId: string | null;
  selectedCompanyId: string | null;
  interviewOnly: boolean;
  personType: PersonType;
  searchQuery: string;
  onFieldChange: (fieldId: string | null) => void;
  onCompanyChange: (companyId: string | null) => void;
  onInterviewOnlyChange: (value: boolean) => void;
  onPersonTypeChange: (value: PersonType) => void;
  onSearchChange: (value: string) => void;
}

export function NetworkFilters({
  fields,
  companies,
  selectedFieldId,
  selectedCompanyId,
  interviewOnly,
  personType,
  searchQuery,
  onFieldChange,
  onCompanyChange,
  onInterviewOnlyChange,
  onPersonTypeChange,
  onSearchChange,
}: NetworkFiltersProps) {
  return (
    <div className="space-y-4">
      <Tabs
        value={personType}
        onValueChange={(v) => onPersonTypeChange(v as PersonType)}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="experts">Experts</TabsTrigger>
          <TabsTrigger value="supervisors">Supervisors</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-48"
        />

        <select
          value={selectedFieldId ?? ""}
          onChange={(e) => onFieldChange(e.target.value || null)}
          className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm"
        >
          <option value="">All fields</option>
          {fields.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>

        <select
          value={selectedCompanyId ?? ""}
          onChange={(e) => onCompanyChange(e.target.value || null)}
          className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm"
        >
          <option value="">All companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={interviewOnly}
            onChange={(e) => onInterviewOnlyChange(e.target.checked)}
            className="rounded"
          />
          Available for interviews
        </label>
      </div>
    </div>
  );
}
