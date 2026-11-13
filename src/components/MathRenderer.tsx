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
 */
export function renderLatexToHtml(latex: string, displayMode: boolean = false): string {
  if (!latex) return "";

  const trimmed = latex.trim();

  // 1. Direct formula without text (options, pure matrices, fractions, coordinates)
  if (
    !trimmed.includes("$") &&
    (trimmed.startsWith("\\begin{") ||
      trimmed.startsWith("\\frac{") ||
      trimmed.startsWith("-\\frac{") ||
      trimmed.startsWith("\\pmatrix") ||
      trimmed.startsWith("\\left(") ||
      trimmed.includes("\\begin{pmatrix}") ||
      trimmed.includes("\\cdot"))
  ) {
    try {
      return katex.renderToString(trimmed, {
        displayMode,
        throwOnError: false,
      });
    } catch {
      return trimmed;
    }
  }

  // 2. Preprocess text commands & line breaks
  let text = latex;

  // Convert markdown **bold** and LaTeX \textbf{...}
  text = text.replace(/\\textbf\{([^{}]+(?:\$[^{}$]+\$[^{}]*)*)\}/g, "<strong>$1</strong>");
  text = text.replace(/\\textbf\{([^}]+)\}/g, "<strong>$1</strong>");
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\\textit\{([^}]+)\}/g, "<em>$1</em>");

  // Line breaks & spacing
  text = text.replace(/\\\\\[\d+pt\]/g, "<br/><br/>");
  text = text.replace(/\\\\/g, "<br/>");
  text = text.replace(/\\newline/g, "<br/>");
  text = text.replace(/\\quad/g, "&emsp;");

  // 3. Process Display Math: $$ ... $$
  const displayRegex = /\$\$([\s\S]+?)\$\$/g;
  text = text.replace(displayRegex, (_, mathContent) => {
    // Strip any accidental internal dollar signs
    const cleanMath = mathContent.replace(/\$/g, "").trim();
    try {
      return katex.renderToString(cleanMath, {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      return mathContent;
    }
  });

  // 4. Process Inline Math: $ ... $
  const inlineRegex = /\$([^\$]+?)\$/g;
  text = text.replace(inlineRegex, (_, mathContent) => {
    const cleanMath = mathContent.trim();
    try {
      return katex.renderToString(cleanMath, {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return mathContent;
    }
  });

  // 5. Catch any un-wrapped \begin{pmatrix} ... \end{pmatrix} that remained outside $
  const matrixRegex = /\\begin\{pmatrix\}[\s\S]*?\\end\{pmatrix\}/g;
  text = text.replace(matrixRegex, (matrixContent) => {
    try {
      return katex.renderToString(matrixContent.trim(), {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return matrixContent;
    }
  });

  return text;
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
