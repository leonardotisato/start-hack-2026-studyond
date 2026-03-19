"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/lib/avatar";
import type { MutualConnection } from "@/lib/mock-connections";
import type { Expert, Company, Field } from "@/types";

interface ExpertCardProps {
  expert: Expert;
  company: Company | null;
  fields: Field[];
  sharedFieldIds: string[];
  matchScore: number;
  mutualConnections: MutualConnection[];
  onRequestIntro: (expertId: string) => void;
  onIcebreaker: (expertId: string) => void;
}

export function ExpertCard({
  expert,
  company,
  fields,
  sharedFieldIds,
  matchScore,
  mutualConnections,
  onRequestIntro,
  onIcebreaker,
}: ExpertCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const sharedSet = new Set(sharedFieldIds);
  const matchPercent = Math.round(matchScore * 100);

  return (
    <>
      <Card
        className="cursor-pointer hover:bg-accent/50 transition"
        onClick={() => setDetailOpen(true)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="shrink-0">
                <AvatarImage
                  src={getAvatarUrl(expert.firstName, expert.lastName)}
                  alt={`${expert.firstName} ${expert.lastName}`}
                />
                <AvatarFallback>
                  {expert.firstName[0]}
                  {expert.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <CardTitle className="text-base">
                  {expert.firstName} {expert.lastName}
                </CardTitle>
                <p className="text-sm text-muted-foreground truncate">
                  {expert.title} &middot; {company?.name ?? "Independent"}
                </p>
              </div>
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
          <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onIcebreaker(expert.id)}
            >
              Conversation Starters
            </Button>
            <div
              title={
                mutualConnections.length === 0
                  ? "No mutual connections found to facilitate an introduction"
                  : undefined
              }
            >
              <Button
                size="sm"
                disabled={mutualConnections.length === 0}
                onClick={() => onRequestIntro(expert.id)}
              >
                Request Introduction
                {mutualConnections.length > 0 && (
                  <span className="ml-1 text-xs opacity-70">
                    · {mutualConnections.length}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <Avatar size="lg" className="shrink-0">
                <AvatarImage
                  src={getAvatarUrl(expert.firstName, expert.lastName)}
                  alt={`${expert.firstName} ${expert.lastName}`}
                />
                <AvatarFallback>
                  {expert.firstName[0]}
                  {expert.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl">
                  {expert.firstName} {expert.lastName}
                </DialogTitle>
                <DialogDescription>
                  {expert.title} &middot; {company?.name ?? "Independent"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {expert.offerInterviews && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <span className="inline-block size-2 rounded-full bg-emerald-500" />
                  Available for interviews
                </span>
              )}
              {matchPercent > 0 && (
                <Badge variant="secondary">{matchPercent}% field match</Badge>
              )}
            </div>

            {expert.about && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {expert.about}
              </p>
            )}

            <Separator />

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                Fields
              </p>
              <div className="flex flex-wrap gap-1.5">
                {fields.map((f) => (
                  <Badge
                    key={f.id}
                    variant={sharedSet.has(f.id) ? "default" : "outline"}
                  >
                    {f.name}
                    {sharedSet.has(f.id) && " ✓"}
                  </Badge>
                ))}
              </div>
            </div>

            {expert.objectives.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Objectives
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {expert.objectives.map((obj) => (
                    <Badge key={obj} variant="secondary">
                      {obj.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {mutualConnections.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Mutual Connections
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {mutualConnections.map((conn) => (
                    <Badge key={conn.id} variant="outline">
                      {conn.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDetailOpen(false);
                  onIcebreaker(expert.id);
                }}
              >
                Conversation Starters
              </Button>
              <div
                title={
                  mutualConnections.length === 0
                    ? "No mutual connections found to facilitate an introduction"
                    : undefined
                }
              >
                <Button
                  size="sm"
                  disabled={mutualConnections.length === 0}
                  onClick={() => {
                    setDetailOpen(false);
                    onRequestIntro(expert.id);
                  }}
                >
                  Request Introduction
                  {mutualConnections.length > 0 && (
                    <span className="ml-1 text-xs opacity-70">
                      · {mutualConnections.length}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
