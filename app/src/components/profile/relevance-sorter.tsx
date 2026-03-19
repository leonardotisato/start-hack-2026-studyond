"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ThesisProject } from "@/types";
import { Sparkles, Loader2, X } from "lucide-react";

interface RelevanceSorterProps {
    projects: ThesisProject[];
    onSort: (sortedProjects: ThesisProject[]) => void;
}

export function RelevanceSorter({ projects, onSort }: RelevanceSorterProps) {
    const [targetRole, setTargetRole] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSorted, setIsSorted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSort() {
        if (!targetRole.trim() || projects.length === 0) return;

        setIsLoading(true);
        setError(null);

        try {
            const projectSummaries = projects.map((p) => ({
                id: p.id,
                title: p.title,
                description: p.description,
                motivation: p.motivation,
                state: p.state,
            }));

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    systemPrompt: `You are a career relevance analyst. Given a list of thesis projects and a target role, return ONLY a valid JSON array of project IDs sorted from most relevant to least relevant for the target role. No explanation, no markdown, just the JSON array. Example: ["project-01","project-03","project-02"]`,
                    messages: [
                        {
                            role: "user",
                            content: `Target role: "${targetRole.trim()}"\n\nProjects:\n${JSON.stringify(projectSummaries, null, 2)}\n\nReturn only a JSON array of project IDs sorted by relevance to the target role.`,
                        },
                    ],
                }),
            });

            if (!res.ok) throw new Error("Failed to sort projects");

            const data = await res.json();
            const message: string = data.message;

            // Extract JSON array from response
            const match = message.match(/\[[\s\S]*?\]/);
            if (!match) throw new Error("Invalid AI response format");

            const sortedIds: string[] = JSON.parse(match[0]);

            // Reorder projects based on AI response
            const projectMap = new Map(projects.map((p) => [p.id, p]));
            const sorted: ThesisProject[] = [];

            for (const id of sortedIds) {
                const project = projectMap.get(id);
                if (project) {
                    sorted.push(project);
                    projectMap.delete(id);
                }
            }

            // Append any projects not mentioned by the AI
            for (const remaining of projectMap.values()) {
                sorted.push(remaining);
            }

            onSort(sorted);
            setIsSorted(true);
        } catch {
            setError("Could not sort projects. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    function handleReset() {
        onSort(projects);
        setIsSorted(false);
        setTargetRole("");
        setError(null);
    }

    return (
        <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
            <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-medium">AI Relevance Sorting</h3>
            </div>

            <div className="flex gap-2">
                <Input
                    placeholder="Enter target role (e.g., ML Engineer at Google)"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSort()}
                    disabled={isLoading}
                    className="flex-1"
                />
                <Button
                    onClick={handleSort}
                    disabled={isLoading || !targetRole.trim()}
                    size="default"
                    className="shrink-0"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Sorting…
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Sort
                        </>
                    )}
                </Button>
                {isSorted && (
                    <Button
                        onClick={handleReset}
                        variant="outline"
                        size="default"
                        className="shrink-0"
                    >
                        <X className="h-4 w-4 mr-1" />
                        Reset
                    </Button>
                )}
            </div>

            {error && (
                <p className="text-sm text-destructive mt-2">{error}</p>
            )}

            {isSorted && !error && (
                <p className="text-xs text-muted-foreground mt-2">
                    ✨ Projects sorted by relevance to &quot;{targetRole}&quot;
                </p>
            )}
        </div>
    );
}
