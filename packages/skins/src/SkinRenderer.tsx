import {
  manimVideoSrc,
  type ContentPrimitive,
  type ResolvedAnchor,
  type ResolvedSkinBinding,
} from "@spatial-present/schema";
import type { ProjectIndex } from "@spatial-present/core";
import { EngravingSkin } from "./EngravingSkin";
import { HologramChartSkin } from "./HologramChartSkin";
import { ConstellationSkin } from "./ConstellationSkin";
import { CloudTextSkin } from "./CloudTextSkin";
import { PlaqueSkin } from "./PlaqueSkin";
import { ChalkboardSkin } from "./ChalkboardSkin";
import { EtchedGlassSkin } from "./EtchedGlassSkin";
import { ProjectionSkin } from "./ProjectionSkin";

/**
 * Renders every content primitive bound to an anchor through its spatial
 * skin, positioned at the anchor transform. The primitive owns the data;
 * the skin owns the look.
 */
export function AnchorContent({
  index,
  anchor,
  active,
  revealStep = 0,
}: {
  index: ProjectIndex;
  anchor: ResolvedAnchor;
  active: boolean;
  /** Completed reveal steps at the current beat (stepwise content). */
  revealStep?: number;
}) {
  const bindings = index.bindingsByAnchor.get(anchor.id) ?? [];
  return (
    <group position={anchor.position} rotation={[0, anchor.rotationY, 0]}>
      {bindings.map((binding) => {
        const content = index.contentById.get(binding.contentId);
        if (!content) return null;
        return (
          <Skinned
            key={binding.id}
            binding={binding}
            content={content}
            active={active}
            revealStep={revealStep}
          />
        );
      })}
    </group>
  );
}

function Skinned({
  binding,
  content,
  active,
  revealStep,
}: {
  binding: ResolvedSkinBinding;
  content: ContentPrimitive;
  active: boolean;
  revealStep: number;
}) {
  const base = { active, params: binding.params, revealStep };
  switch (binding.skinKind) {
    case "engraving":
      if (content.kind !== "text") return null;
      return <EngravingSkin {...base} title={content.title} body={content.body} />;
    case "hologram":
      if (content.kind !== "chart") return null;
      return <HologramChartSkin {...base} data={content.data} />;
    case "constellation":
      if (content.kind !== "chart") return null;
      return <ConstellationSkin {...base} data={content.data} />;
    case "cloudText":
      if (content.kind !== "text") return null;
      return <CloudTextSkin {...base} title={content.title} body={content.body} />;
    case "plaque":
      if (content.kind !== "image" && content.kind !== "video") return null;
      return (
        <PlaqueSkin
          {...base}
          src={content.src}
          title={content.title}
          caption={content.caption}
          alt={content.alt}
          video={content.kind === "video"}
        />
      );
    case "chalkboard":
      if (content.kind === "formula")
        return <ChalkboardSkin {...base} latex={content.latex} />;
      if (content.kind === "text")
        return <ChalkboardSkin {...base} title={content.title} body={content.body} />;
      return null;
    case "etchedGlass":
      if (content.kind !== "formula") return null;
      return <EtchedGlassSkin {...base} latex={content.latex} />;
    case "projection":
      if (content.kind !== "manim") return null;
      return (
        <ProjectionSkin
          {...base}
          src={manimVideoSrc(content.id)}
          contentId={content.id}
          reveal={content.reveal ?? "play"}
          revealStep={revealStep}
        />
      );
  }
}
