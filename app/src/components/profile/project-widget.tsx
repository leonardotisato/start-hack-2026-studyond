"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ThesisProject, Topic, Company } from "@/types";
import {
  Calendar,
  Building2,
  BookOpen,
  Users,
  GraduationCap,
} from "lucide-react";

interface ProjectWidgetProps {
  project: ThesisProject;
  topic?: Topic | null;
  company?: Company | null;
}

const STATE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  proposed: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-800 dark:text-amber-300", label: "Proposed" },
  applied: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-800 dark:text-blue-300", label: "Applied" },
  withdrawn: { bg: "bg-gray-100 dark:bg-gray-700/30", text: "text-gray-600 dark:text-gray-400", label: "Withdrawn" },
  rejected: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-800 dark:text-red-300", label: "Rejected" },
  agreed: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-800 dark:text-emerald-300", label: "Agreed" },
  in_progress: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-800 dark:text-indigo-300", label: "In Progress" },
  canceled: { bg: "bg-gray-100 dark:bg-gray-700/30", text: "text-gray-600 dark:text-gray-400", label: "Canceled" },
  completed: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-800 dark:text-green-300", label: "Completed" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ProjectWidget({ project, topic, company }: ProjectWidgetProps) {
  const style = STATE_STYLES[project.state] ?? STATE_STYLES.proposed;

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border-border/60">
      {/* Accent bar at top */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${style.bg} transition-all duration-300 group-hover:h-1.5`}
      />

      <CardHeader className="pt-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg font-semibold leading-snug">
            {project.title}
          </CardTitle>
          <span
            className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
          >
            {style.label}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-5">
        {project.description && (
          <p className="text-sm text-foreground/80 leading-relaxed">
            {project.description}
          </p>
        )}

        {project.motivation && (
          <p className="text-sm text-muted-foreground italic border-l-2 border-muted pl-3">
            &ldquo;{project.motivation}&rdquo;
          </p>
        )}

        <Separator className="opacity-50" />

        {/* Meta info row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          {topic && (
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              <span className="max-w-[200px] truncate">{topic.title}</span>
            </span>
          )}

          {company && (
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              {company.name}
            </span>
          )}

          {project.supervisorIds.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5" />
              {project.supervisorIds.length} supervisor{project.supervisorIds.length > 1 ? "s" : ""}
            </span>
          )}

          {project.expertIds.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {project.expertIds.length} expert{project.expertIds.length > 1 ? "s" : ""}
            </span>
          )}

          <span className="inline-flex items-center gap-1.5 ml-auto">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(project.updatedAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
