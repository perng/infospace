import type { PresentationStore } from "@spatial-present/core";
import type { ContentPrimitive } from "@spatial-present/schema";

/**
 * The linear fallback: a readable, screen-reader-friendly document derived
 * from the same project model that drives the 3D world. The world is the
 * source of truth; this view is generated from its semantics.
 */
export function OutlineView({ store }: { store: PresentationStore }) {
  const index = store((s) => s.index);
  const open = store((s) => s.outlineOpen);
  const currentBeatId = store((s) => s.currentBeatId);
  if (!open) return null;

  return (
    <div className="outline" role="document">
      <div className="outline-inner">
        <header>
          <h1>{index.project.title}</h1>
          <p className="outline-sub">
            Linear outline — derived automatically from the spatial
            presentation model. {index.outlineOrder.length} beats across{" "}
            {index.project.worlds.map((w) => w.name).join(" and ")}.
          </p>
          <button className="btn" onClick={() => store.getState().setOutlineOpen(false)}>
            ✕ Close outline (O)
          </button>
        </header>
        <ol>
          {index.outlineOrder.map((beat) => {
            const anchor = index.anchorById.get(beat.anchorId)!;
            const world = index.project.worlds.find((w) => w.id === anchor.worldId)!;
            return (
              <li
                key={beat.id}
                className={beat.id === currentBeatId ? "outline-current" : ""}
              >
                <h2>
                  <button
                    className="outline-jump"
                    onClick={() => {
                      store.getState().setOutlineOpen(false);
                      store.getState().goToBeat(beat.id);
                    }}
                  >
                    {beat.title}
                  </button>
                  <span className="outline-where">
                    {world.name} · {anchor.name}
                  </span>
                </h2>
                {anchor.contentIds.map((cid) => {
                  const content = index.contentById.get(cid);
                  return content ? (
                    <ContentFallback key={cid} content={content} />
                  ) : null;
                })}
                {beat.notes && (
                  <p className="outline-notes">
                    <strong>Speaker notes:</strong> {beat.notes}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function ContentFallback({ content }: { content: ContentPrimitive }) {
  switch (content.kind) {
    case "text":
      return (
        <div className="outline-text">
          {content.title && <h3>{content.title}</h3>}
          {content.body.split("\n\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      );
    case "chart":
      return (
        <div className="outline-chart">
          <h3>{content.data.title}</h3>
          <p>{content.fallbackText}</p>
          <table>
            <tbody>
              {content.data.type === "bar"
                ? content.data.series.map((s) => (
                    <tr key={s.label}>
                      <td>{s.label}</td>
                      <td>
                        {s.value.toLocaleString()}
                        {content.data.type === "bar" && content.data.unit
                          ? ` ${content.data.unit}`
                          : ""}
                      </td>
                    </tr>
                  ))
                : content.data.points.map((p) => (
                    <tr key={p.label}>
                      <td>{p.label}</td>
                      <td>{p.x.toLocaleString()}</td>
                      <td>{p.y.toLocaleString()}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      );
    case "image":
    case "video":
      return (
        <div className="outline-media">
          {content.title && <h3>{content.title}</h3>}
          <p>
            <em>{content.kind === "image" ? "Image" : "Film"}:</em> {content.alt}
          </p>
        </div>
      );
  }
}
