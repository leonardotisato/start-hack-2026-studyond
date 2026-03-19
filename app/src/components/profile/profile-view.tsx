"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import type {
  Student,
  ThesisProject,
  Field,
  StudyProgram,
  University,
  Topic,
  Company,
} from "@/types";
import { ProjectWidget } from "./project-widget";
import { SkillsSection } from "./skills-section";
import { RelevanceSorter } from "./relevance-sorter";
import { Mail, MapPin, GraduationCap, Eye, MessageCircle } from "lucide-react";

interface ProfileViewProps {
  student: Student;
  projects: ThesisProject[];
  fields: Field[];
  program: StudyProgram | null;
  university: University | null;
  topics: Topic[];
  companies: Company[];
  viewerMode?: boolean;
}

export function ProfileView({
  student,
  projects: initialProjects,
  fields,
  program,
  university,
  topics,
  companies,
  viewerMode = false,
}: ProfileViewProps) {
  const [projects, setProjects] = useState(initialProjects);

  const initials =
    (student.firstName?.[0] ?? "") + (student.lastName?.[0] ?? "");

  const degreeLabel =
    student.degree === "bsc"
      ? "Bachelor"
      : student.degree === "msc"
        ? "Master"
        : "PhD";

  function getTopicForProject(project: ThesisProject): Topic | null {
    if (!project.topicId) return null;
    return topics.find((t) => t.id === project.topicId) ?? null;
  }

  function getCompanyForProject(project: ThesisProject): Company | null {
    if (!project.companyId) return null;
    return companies.find((c) => c.id === project.companyId) ?? null;
  }

  return (
    <div className="space-y-8">
      {/* Viewer Mode Banner */}
      {viewerMode && (
        <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-4 py-2.5 text-sm text-primary">
          <Eye className="h-4 w-4 shrink-0" />
          <span className="font-medium">Company View</span>
          <span className="text-primary/70">
            — You are viewing this profile as a company representative
          </span>
        </div>
      )}

      {/* ── Profile Header ── */}
      <Card className="overflow-hidden">
        {/* Gradient accent */}
        <div className="h-16 bg-gradient-to-r from-primary/80 via-primary/60 to-primary/30" />

        <CardHeader className="relative pb-2 -mt-8 px-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Avatar className="h-20 w-20 border-4 border-background shadow-lg text-xl font-bold">
              <AvatarImage src="/luca-meier.jpg" alt={`${student.firstName} ${student.lastName}`} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 pt-2 sm:pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <CardTitle className="text-2xl font-bold">
                  {student.firstName} {student.lastName}
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="w-fit text-xs font-medium"
                >
                  {degreeLabel}
                </Badge>
              </div>

              {/* Info row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                {program && (
                  <span className="inline-flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4" />
                    {program.name}
                  </span>
                )}
                {university && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {university.name}
                  </span>
                )}
                {!viewerMode && (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-4 w-4" />
                    {student.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          {student.about && (
            <p className="line-clamp-3 text-sm text-foreground/80 leading-relaxed mt-2 max-w-2xl">
              {student.about}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Skills Section ── */}
      <Card>
        <CardContent className="pt-6">
          <SkillsSection
            skills={student.skills}
            fields={fields}
            objectives={student.objectives}
          />
        </CardContent>
      </Card>

      {/* ── Projects Section ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Projects &amp; Experiences</h2>
          <Badge variant="outline" className="text-xs">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {/* AI Sorter */}
        {projects.length > 1 && (
          <RelevanceSorter projects={initialProjects} onSort={setProjects} />
        )}

        {/* Project Cards */}
        {projects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No projects yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {projects.map((project) => (
              <ProjectWidget
                key={project.id}
                project={project}
                topic={getTopicForProject(project)}
                company={getCompanyForProject(project)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Viewer Mode CTA ── */}
      {viewerMode && (
        <>
          <Separator />
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex flex-col sm:flex-row items-center gap-4 py-6">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  Interested in this student?
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Reach out to discuss thesis collaboration, internship
                  opportunities, or career openings.
                </p>
              </div>
              <Button size="lg" className="shrink-0">
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Student
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
