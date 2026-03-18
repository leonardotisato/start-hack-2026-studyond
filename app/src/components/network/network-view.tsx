"use client";

import { useState, useMemo } from "react";
import { sortByMatch } from "@/lib/matching";
import { ExpertCard } from "@/components/network/expert-card";
import { NetworkFilters, type PersonType } from "@/components/network/network-filters";
import { IntroRequestDialog } from "@/components/network/intro-request-dialog";
import { IcebreakerPanel } from "@/components/network/icebreaker-panel";
import type { Expert, Supervisor, Company, Field, Student } from "@/types";

interface NetworkViewProps {
  experts: Expert[];
  supervisors: Supervisor[];
  companies: Company[];
  fields: Field[];
  student: Student;
}

type NetworkPerson =
  | { kind: "expert"; data: Expert }
  | { kind: "supervisor"; data: Supervisor };

export function NetworkView({
  experts,
  supervisors,
  companies,
  fields,
  student,
}: NetworkViewProps) {
  const [personType, setPersonType] = useState<PersonType>("all");
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [interviewOnly, setInterviewOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [introExpertId, setIntroExpertId] = useState<string | null>(null);
  const [introOpen, setIntroOpen] = useState(false);
  const [icebreakerExpertId, setIcebreakerExpertId] = useState<string | null>(null);
  const [icebreakerOpen, setIcebreakerOpen] = useState(false);

  const companyMap = useMemo(
    () => new Map(companies.map((c) => [c.id, c])),
    [companies]
  );
  const fieldMap = useMemo(
    () => new Map(fields.map((f) => [f.id, f])),
    [fields]
  );

  const people: NetworkPerson[] = useMemo(() => {
    const result: NetworkPerson[] = [];
    if (personType !== "supervisors") {
      for (const e of experts) result.push({ kind: "expert", data: e });
    }
    if (personType !== "experts") {
      for (const s of supervisors) result.push({ kind: "supervisor", data: s });
    }
    return result;
  }, [experts, supervisors, personType]);

  const matched = useMemo(
    () =>
      sortByMatch(people, student.fieldIds, (p) => p.data.fieldIds),
    [people, student.fieldIds]
  );

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return matched.filter((item) => {
      const p = item.data;
      if (query) {
        const name = `${p.firstName} ${p.lastName}`.toLowerCase();
        if (!name.includes(query)) return false;
      }
      if (selectedFieldId && !p.fieldIds.includes(selectedFieldId)) return false;
      if (item.kind === "expert") {
        if (selectedCompanyId && item.data.companyId !== selectedCompanyId) return false;
        if (interviewOnly && !item.data.offerInterviews) return false;
      } else {
        if (selectedCompanyId) return false;
        if (interviewOnly) return false;
      }
      return true;
    });
  }, [matched, searchQuery, selectedFieldId, selectedCompanyId, interviewOnly]);

  const introExpert = experts.find((e) => e.id === introExpertId) ?? null;
  const introCompany = introExpert ? companyMap.get(introExpert.companyId) ?? null : null;

  const icebreakerExpert = experts.find((e) => e.id === icebreakerExpertId) ?? null;
  const icebreakerCompany = icebreakerExpert
    ? companyMap.get(icebreakerExpert.companyId) ?? null
    : null;

  const studentFields = student.fieldIds
    .map((id) => fieldMap.get(id))
    .filter((f): f is Field => f != null);

  const icebreakerExpertFields = icebreakerExpert
    ? icebreakerExpert.fieldIds
        .map((id) => fieldMap.get(id))
        .filter((f): f is Field => f != null)
    : [];

  return (
    <div className="space-y-6">
      <NetworkFilters
        fields={fields}
        companies={companies}
        selectedFieldId={selectedFieldId}
        selectedCompanyId={selectedCompanyId}
        interviewOnly={interviewOnly}
        personType={personType}
        searchQuery={searchQuery}
        onFieldChange={setSelectedFieldId}
        onCompanyChange={setSelectedCompanyId}
        onInterviewOnlyChange={setInterviewOnly}
        onPersonTypeChange={setPersonType}
        onSearchChange={setSearchQuery}
      />

      <p className="text-sm text-muted-foreground">
        Showing {filtered.length} connections
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((item) => {
          const p = item.data;
          const personFields = p.fieldIds
            .map((id) => fieldMap.get(id))
            .filter((f): f is Field => f != null);

          if (item.kind === "expert") {
            const expert = item.data as Expert;
            return (
              <ExpertCard
                key={expert.id}
                expert={expert}
                company={companyMap.get(expert.companyId) ?? null}
                fields={personFields}
                sharedFieldIds={item.match.sharedFieldIds}
                matchScore={item.match.score}
                onRequestIntro={(id) => {
                  setIntroExpertId(id);
                  setIntroOpen(true);
                }}
                onIcebreaker={(id) => {
                  setIcebreakerExpertId(id);
                  setIcebreakerOpen(true);
                }}
              />
            );
          }

          const sup = item.data as Supervisor;
          const fakeExpert: Expert = {
            id: sup.id,
            firstName: sup.firstName,
            lastName: sup.lastName,
            email: sup.email,
            title: sup.title,
            companyId: "",
            offerInterviews: false,
            about: sup.about,
            objectives: [],
            fieldIds: sup.fieldIds,
          };
          return (
            <ExpertCard
              key={sup.id}
              expert={fakeExpert}
              company={{ id: "", name: "University", description: "", about: null, size: "", domains: [] }}
              fields={personFields}
              sharedFieldIds={item.match.sharedFieldIds}
              matchScore={item.match.score}
              onRequestIntro={(id) => {
                setIntroExpertId(id);
                setIntroOpen(true);
              }}
              onIcebreaker={(id) => {
                setIcebreakerExpertId(id);
                setIcebreakerOpen(true);
              }}
            />
          );
        })}
      </div>

      <IntroRequestDialog
        expert={introExpert}
        company={introCompany}
        open={introOpen}
        onOpenChange={setIntroOpen}
      />

      <IcebreakerPanel
        expert={icebreakerExpert}
        company={icebreakerCompany}
        student={student}
        studentFields={studentFields}
        expertFields={icebreakerExpertFields}
        open={icebreakerOpen}
        onOpenChange={setIcebreakerOpen}
      />
    </div>
  );
}
