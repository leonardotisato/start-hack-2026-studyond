import React from "react";
import { Composition } from "remotion";
import { DemoVideo } from "./DemoVideo";
import { LogoIntro } from "./scenes/LogoIntro";
import { ProblemStatement } from "./scenes/ProblemStatement";
import { SolutionIntro } from "./scenes/SolutionIntro";
import { GraphReveal } from "./scenes/GraphReveal";
import { AiChatRestructure } from "./scenes/AiChatRestructure";
import { ProgressMontage } from "./scenes/ProgressMontage";
import { ClosingCta } from "./scenes/ClosingCta";

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Full video */}
      <Composition
        id="DemoVideo"
        component={DemoVideo}
        durationInFrames={2250}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />

      {/* Individual scenes for isolated testing */}
      <Composition
        id="LogoIntro"
        component={LogoIntro}
        durationInFrames={120}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="ProblemStatement"
        component={ProblemStatement}
        durationInFrames={360}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="SolutionIntro"
        component={SolutionIntro}
        durationInFrames={240}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="GraphReveal"
        component={GraphReveal}
        durationInFrames={420}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="AiChatRestructure"
        component={AiChatRestructure}
        durationInFrames={540}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="ProgressMontage"
        component={ProgressMontage}
        durationInFrames={270}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="ClosingCta"
        component={ClosingCta}
        durationInFrames={300}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
