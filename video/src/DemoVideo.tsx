import React from "react";
import { Series, Audio, staticFile } from "remotion";
import { LogoIntro } from "./scenes/LogoIntro";
import { ProblemStatement } from "./scenes/ProblemStatement";
import { SolutionIntro } from "./scenes/SolutionIntro";
import { GraphReveal } from "./scenes/GraphReveal";
import { AiChatRestructure } from "./scenes/AiChatRestructure";
import { ProgressMontage } from "./scenes/ProgressMontage";
import { ClosingCta } from "./scenes/ClosingCta";

export const DemoVideo: React.FC = () => {
  return (
    <>
      {/* Voiceover — uncomment when voiceover.mp3 is ready */}
      {/* <Audio src={staticFile("voiceover.mp3")} /> */}

      <Series>
        {/* Scene 1: Logo Intro — 0:00–0:04 (120 frames) */}
        <Series.Sequence durationInFrames={120}>
          <LogoIntro />
        </Series.Sequence>

        {/* Scene 2: Problem Statement — 0:04–0:16 (360 frames) */}
        <Series.Sequence durationInFrames={360}>
          <ProblemStatement />
        </Series.Sequence>

        {/* Scene 3: Solution Intro — 0:16–0:24 (240 frames) */}
        <Series.Sequence durationInFrames={240}>
          <SolutionIntro />
        </Series.Sequence>

        {/* Scene 4: Graph Reveal — 0:24–0:38 (420 frames) */}
        <Series.Sequence durationInFrames={420}>
          <GraphReveal />
        </Series.Sequence>

        {/* Scene 5: AI Chat + Restructure — 0:38–0:56 (540 frames) */}
        <Series.Sequence durationInFrames={540}>
          <AiChatRestructure />
        </Series.Sequence>

        {/* Scene 6: Progress Montage — 0:56–1:06 (270 frames) */}
        <Series.Sequence durationInFrames={270}>
          <ProgressMontage />
        </Series.Sequence>

        {/* Scene 7: Closing CTA — 1:06–1:15 (300 frames) */}
        <Series.Sequence durationInFrames={300}>
          <ClosingCta />
        </Series.Sequence>
      </Series>
    </>
  );
};
