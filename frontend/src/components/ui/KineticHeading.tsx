// New file: src/components/ui/KineticHeading.tsx
// Mask-up text reveal — each word slides up through an overflow:hidden mask.
// No external dependencies. Import wherever you need kinetic headings.

import { type CSSProperties, type ElementType, type FC, useEffect, useState } from "react";

const REVEAL_DURATION = 820;
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

interface KineticHeadingProps {
  text:       string;
  as?:        "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  mode?:      "words" | "chars";
  staggerMs?: number;
  delay?:     number;
  className?: string;
  style?:     CSSProperties;
}

// ─── KineticHeading — word or character mask-up reveal ────────────────────────
const KineticHeading: FC<KineticHeadingProps> = ({
  text,
  as: Tag = "h1",
  mode = "words",
  staggerMs = 70,
  delay = 0,
  className,
  style,
}) => {
  const units = mode === "chars" ? text.split("") : text.split(" ");
  const [fired, setFired] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFired(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const TagComp = Tag as ElementType;

  return (
    <TagComp
      className={className}
      style={{ ...style, display: "block" }}
      aria-label={text}
    >
      {units.map((unit, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            display:       "inline-block",
            overflow:      "hidden",          // ← the mask
            verticalAlign: "bottom",
            marginRight:   mode === "words" && i < units.length - 1 ? "0.28em" : undefined,
          }}
        >
          <span
            style={{
              display:    "inline-block",
              // Starts 110% below the mask → invisible. Animates to 0% → revealed.
              transform:  fired ? "translateY(0%)" : "translateY(112%)",
              transition: `transform ${REVEAL_DURATION}ms ${EASE} ${i * staggerMs}ms`,
              willChange: "transform",
            }}
          >
            {unit}
          </span>
        </span>
      ))}
    </TagComp>
  );
};

export default KineticHeading;

// ─── KineticLine — single-line reveal (whole line rises as one unit) ──────────
export const KineticLine: FC<Omit<KineticHeadingProps, "mode" | "staggerMs">> = ({
  text,
  as: Tag = "p",
  delay = 0,
  className,
  style,
}) => {
  const [fired, setFired] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFired(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const TagComp = Tag as ElementType;

  return (
    <TagComp
      className={className}
      style={{ ...style, overflow: "hidden", display: "block" }}
      aria-label={text}
    >
      <span
        aria-hidden="true"
        style={{
          display:    "inline-block",
          transform:  fired ? "translateY(0%)" : "translateY(108%)",
          transition: `transform ${REVEAL_DURATION}ms ${EASE}`,
          willChange: "transform",
        }}
      >
        {text}
      </span>
    </TagComp>
  );
};
