"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Expert, Company, Field } from "@/types";

interface ExpertCardProps {
  expert: Expert;
  company: Company | null;
  fields: Field[];
  sharedFieldIds: string[];
  matchScore: number;
  onRequestIntro: (expertId: string) => void;
  onIcebreaker: (expertId: string) => void;
}

export function ExpertCard({
  expert,
  company,
  fields,
  sharedFieldIds,
  matchScore,
  onRequestIntro,
  onIcebreaker,
}: ExpertCardProps) {
  const sharedSet = new Set(sharedFieldIds);
  const matchPercent = Math.round(matchScore * 100);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">
              {expert.firstName} {expert.lastName}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {expert.title} &middot; {company?.name ?? "Independent"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {expert.offerInterviews && (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <span className="inline-block size-2 rounded-full bg-emerald-500" />
                Interviews
              </span>
            )}
            {matchPercent > 0 && (
              <Badge variant="secondary" className="text-xs">
                {matchPercent}% match
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {expert.about && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {expert.about}
          </p>
        )}
        <div className="flex flex-wrap gap-1">
          {fields.map((f) => (
            <Badge
              key={f.id}
              variant={sharedSet.has(f.id) ? "default" : "outline"}
            >
              {f.name}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {expert.objectives.map((obj) => (
            <Badge key={obj} variant="secondary" className="text-xs">
              {obj.replace("_", " ")}
            </Badge>
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onIcebreaker(expert.id)}
          >
            Conversation Starters
          </Button>
          <Button size="sm" onClick={() => onRequestIntro(expert.id)}>
            Request Introduction
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
