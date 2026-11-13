"use client";

import React, { useMemo } from "react";
import katex from "katex";

interface MathRendererProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

/**
 * Pure parsing function that handles mixed Markdown, LaTeX text commands,
 * display math ($$...$$), inline math ($...$), and raw matrix blocks.
 *
 * CRITICAL: Math environments and LaTeX commands MUST be tokenized and preserved
 * BEFORE any text replacements (like converting newlines or bold), so that matrix
 * row breaks (\\) are never replaced by <br/>.
 */
export function renderLatexToHtml(latex: string, displayMode: boolean = false): string {
  if (!latex) return "";

  const trimmed = latex.trim();

  // 1. Pure math / standalone formula (matrices, fractions, determinants, vectors)
  const isPureFormula =
    !trimmed.includes(" ") ||
    trimmed.startsWith("\\begin{") ||
    trimmed.startsWith("\\frac{") ||
    trimmed.startsWith("-\\frac{") ||
    trimmed.startsWith("\\pmatrix") ||
    trimmed.startsWith("\\left(") ||
    trimmed.startsWith("\\det") ||
    (/^[\-\+0-9\/,\s\(\)\{\}\^\_a-zA-Z\\]+$/.test(trimmed) &&
      (trimmed.includes("\\") || trimmed.includes("^") || trimmed.includes("_") || trimmed.includes("{")));

  if (isPureFormula && !trimmed.includes("$")) {
    try {
      return katex.renderToString(trimmed, {
        displayMode,
        throwOnError: false,
      });
    } catch {
      // fallback
    }
  }

  // 2. Tokenize and extract math blocks BEFORE doing any text replacements
  const mathTokens: { token: string; html: string }[] = [];
  let tokenCounter = 0;

  let processed = latex;

  // A. Display math: $$ ... $$
  processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (_, mathContent) => {
    const token = `KATEXDISPTOKEN${tokenCounter++}END`;
    const cleanMath = mathContent.replace(/\$/g, "").trim();
    let rendered = cleanMath;
    try {
      rendered = katex.renderToString(cleanMath, {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      // keep fallback
    }
    mathTokens.push({ token, html: rendered });
    return token;
  });

  // B. Inline math: $ ... $ (may contain \begin{pmatrix}, fractions, etc.)
  processed = processed.replace(/\$([^\$]+?)\$/g, (_, mathContent) => {
    const token = `KATEXINLTOKEN${tokenCounter++}END`;
    const cleanMath = mathContent.trim();
    let rendered = cleanMath;
    try {
      rendered = katex.renderToString(cleanMath, {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      // keep fallback
    }
    mathTokens.push({ token, html: rendered });
    return token;
  });

  // C. Unwrapped matrix/aligned environments that remained outside of $
  processed = processed.replace(
    /\\begin\{(?:pmatrix|bmatrix|vmatrix|matrix|aligned|cases)\}[\s\S]*?\\end\{(?:pmatrix|bmatrix|vmatrix|matrix|aligned|cases)\}/g,
    (matrixContent) => {
      const token = `KATEXMATTOKEN${tokenCounter++}END`;
      let rendered = matrixContent;
      try {
        rendered = katex.renderToString(matrixContent.trim(), {
          displayMode: false,
          throwOnError: false,
        });
      } catch {
        // keep fallback
      }
      mathTokens.push({ token, html: rendered });
      return token;
    }
  );

  // 3. Process remaining text formatting (bold, italic, spacing)
  // Markdown bold **...** and LaTeX \textbf{...}
  processed = processed.replace(/\\textbf\{([^}]+)\}/g, "<strong>$1</strong>");
  processed = processed.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  processed = processed.replace(/\\textit\{([^}]+)\}/g, "<em>$1</em>");
  processed = processed.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // Spacing & explicit text newlines
  processed = processed.replace(/\\newline/g, "<br/>");
  processed = processed.replace(/\\quad/g, "&emsp;");
  processed = processed.replace(/\n\n/g, "<br/><br/>");

  // 4. Restore math tokens
  for (const { token, html } of mathTokens) {
    processed = processed.split(token).join(html);
  }

  return processed;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  latex,
  displayMode = false,
  className = "",
}) => {
  const html = useMemo(() => {
    return renderLatexToHtml(latex, displayMode);
  }, [latex, displayMode]);

  return (
    <span
      className={`inline-block math-render ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
