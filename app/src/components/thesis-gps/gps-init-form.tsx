"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GpsInitFormProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

export function GpsInitForm({ onSubmit, isLoading }: GpsInitFormProps) {
  const [prompt, setPrompt] = useState("");

  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Initialize Your Thesis GPS</CardTitle>
          <p className="text-muted-foreground">
            Paste your professor&apos;s thesis requirements, milestones, or guidelines below.
            The agent will create a personalized pipeline graph to guide your journey.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Example:\n\nThe thesis should follow these phases:\n1. Literature review (2 weeks)\n2. Research question formulation\n3. Methodology design - choose between quantitative survey or qualitative interviews\n4. Data collection (4 weeks)\n5. Analysis and interpretation\n6. First draft due by May 15\n7. Revision after supervisor feedback\n8. Final submission by June 30`}
            className="min-h-[200px] text-sm"
          />
          <Button
            onClick={() => onSubmit(prompt)}
            disabled={!prompt.trim() || isLoading}
            className="w-full"
          >
            {isLoading ? "Generating your graph..." : "Generate Thesis Graph"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
