"use client";

import React, { useMemo } from "react";
import katex from "katex";

interface MathRendererProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  latex,
  displayMode = false,
  className = "",
}) => {
  const html = useMemo(() => {
    if (!latex) return "";

    let text = latex;

    // 1. If the input is purely a LaTeX matrix or single equation without text
    const trimmed = text.trim();
    if (
      !trimmed.includes("$") &&
      (trimmed.startsWith("\\begin{") ||
        trimmed.startsWith("\\frac{") ||
        trimmed.startsWith("\\pmatrix") ||
        trimmed.startsWith("\\left("))
    ) {
      try {
        return katex.renderToString(trimmed, {
          displayMode: true,
          throwOnError: false,
        });
      } catch {
        return trimmed;
      }
    }

    // 2. Preprocess LaTeX formatting commands in text:
    // Handle \textbf{...} converting to <strong>...</strong> (even if it contains math inside)
    text = text.replace(/\\textbf\{([^{}]+(?:\$[^{}$]+\$[^{}]*)*)\}/g, "<strong>$1</strong>");
    text = text.replace(/\\textbf\{([^}]+)\}/g, "<strong>$1</strong>");
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/\\textit\{([^}]+)\}/g, "<em>$1</em>");

    // Handle line breaks \newline, \\[...pt], \\
    text = text.replace(/\\\\\[\d+pt\]/g, "<br/><br/>");
    text = text.replace(/\\\\/g, "<br/>");
    text = text.replace(/\\newline/g, "<br/>");
    text = text.replace(/\\quad/g, "&emsp;");

    // 3. Ensure any standalone \begin{pmatrix}...\end{pmatrix} that isn't wrapped in $ gets wrapped
    text = text.replace(
      /(?<!\$)\\begin\{pmatrix\}[\s\S]*?\\end\{pmatrix\}(?!\$)/g,
      (match) => `$${match}$`
    );

    // 4. Parse display math $$...$$ and inline math $...$
    // Split by $$...$$ first, then by $...$
    const tokens: string[] = [];
    const displayParts = text.split(/(\$\$[\s\S]+?\$\$)/g);

    for (const dPart of displayParts) {
      if (dPart.startsWith("$$") && dPart.endsWith("$$") && dPart.length > 4) {
        const mathContent = dPart.slice(2, -2).trim();
        try {
          tokens.push(
            katex.renderToString(mathContent, {
              displayMode: true,
              throwOnError: false,
            })
          );
        } catch {
          tokens.push(dPart);
        }
      } else {
        // Now split by inline math $...$
        const inlineParts = dPart.split(/(\$[^\$]+?\$)/g);
        for (const iPart of inlineParts) {
          if (iPart.startsWith("$") && iPart.endsWith("$") && iPart.length > 2) {
            const math = iPart.slice(1, -1).trim();
            try {
              tokens.push(
                katex.renderToString(math, {
                  displayMode: false,
                  throwOnError: false,
                })
              );
            } catch {
              tokens.push(iPart);
            }
          } else {
            tokens.push(iPart);
          }
        }
      }
    }

    return tokens.join("");
  }, [latex, displayMode]);

  return (
    <span
      className={`inline-block math-render ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
