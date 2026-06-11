import type { Anchor, ContentPrimitive, SkinBinding } from "@spatial-present/schema";
import type { ProjectIndex } from "@spatial-present/core";
import { EngravingSkin } from "./EngravingSkin";
import { HologramChartSkin } from "./HologramChartSkin";
import { ConstellationSkin } from "./ConstellationSkin";
import { CloudTextSkin } from "./CloudTextSkin";
import { PlaqueSkin } from "./PlaqueSkin";

/**
 * Renders every content primitive bound to an anchor through its spatial
 * skin, positioned at the anchor transform. The primitive owns the data;
 * the skin owns the look.
 */
export function AnchorContent({
  index,
  anchor,
  active,
}: {
  index: ProjectIndex;
  anchor: Anchor;
  active: boolean;
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
}: {
  binding: SkinBinding;
  content: ContentPrimitive;
  active: boolean;
}) {
  const base = { active, params: binding.params };
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
  }
}
