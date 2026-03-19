import { Badge } from "@/components/ui/badge";
import type { Field, StudentObjective } from "@/types";
import { Wrench, Compass, Target } from "lucide-react";

interface SkillsSectionProps {
    skills: string[];
    fields: Field[];
    objectives: StudentObjective[];
}

const OBJECTIVE_LABELS: Record<StudentObjective, string> = {
    topic: "Looking for a Topic",
    supervision: "Seeking Supervision",
    career_start: "Career Start",
    industry_access: "Industry Access",
    project_guidance: "Project Guidance",
};

export function SkillsSection({ skills, fields, objectives }: SkillsSectionProps) {
    return (
        <div className="space-y-5">
            {/* Technical Skills */}
            {skills.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2.5 flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        Skills &amp; Technologies
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                            <Badge
                                key={skill}
                                variant="secondary"
                                className="px-3 py-1 text-sm font-normal transition-colors hover:bg-primary hover:text-primary-foreground cursor-default"
                            >
                                {skill}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Fields of Interest */}
            {fields.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2.5 flex items-center gap-2">
                        <Compass className="h-4 w-4" />
                        Fields of Interest
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {fields.map((field) => (
                            <Badge
                                key={field.id}
                                variant="outline"
                                className="px-3 py-1 text-sm font-normal border-primary/30 text-primary/80"
                            >
                                {field.name}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Objectives */}
            {objectives.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2.5 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Objectives
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {objectives.map((obj) => (
                            <Badge
                                key={obj}
                                className="px-3 py-1 text-sm font-normal bg-primary/10 text-primary hover:bg-primary/20 border-0"
                            >
                                {OBJECTIVE_LABELS[obj] ?? obj}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
