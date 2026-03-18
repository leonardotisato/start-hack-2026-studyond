"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Student, ThesisProject, Field, StudyProgram, University } from "@/types";

interface ProfileViewProps {
  student: Student;
  projects: ThesisProject[];
  fields: Field[];
  program: StudyProgram | null;
  university: University | null;
}

export function ProfileView({ student, projects, fields, program, university }: ProfileViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {student.firstName} {student.lastName}
          </CardTitle>
          <p className="text-muted-foreground">
            {program?.name} &middot; {university?.name} &middot; {student.degree.toUpperCase()}
          </p>
        </CardHeader>
        <CardContent>
          {student.about && <p className="mb-4">{student.about}</p>}
          <div className="flex flex-wrap gap-2">
            {student.skills.map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {fields.map((field) => (
              <Badge key={field.id} variant="outline">
                {field.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Project Widgets */}
      <h2 className="text-xl font-semibold">Projects & Experiences</h2>
      {projects.length === 0 && (
        <p className="text-muted-foreground">No projects yet.</p>
      )}
      {projects.map((project) => (
        <Card key={project.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{project.title}</CardTitle>
              <Badge>{project.state.replace("_", " ")}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {project.description && <p className="mb-2">{project.description}</p>}
            {project.motivation && (
              <p className="text-sm text-muted-foreground italic">{project.motivation}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
