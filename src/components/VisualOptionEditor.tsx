"use client";

import React, { useState, useEffect } from "react";
import {
  parseMatrix2x2,
  buildMatrix2x2,
  parseVector2,
  buildVector2,
  detectMathFormat,
  MathElementFormat,
} from "@/lib/math-engine/visual-parser";
import { MathRenderer } from "./MathRenderer";
import { Check, Grid2X2, Columns2, Type, Code2 } from "lucide-react";

interface VisualOptionEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  isCorrect: boolean;
  onMarkCorrect: () => void;
  letter: string;
}

export const VisualOptionEditor: React.FC<VisualOptionEditorProps> = ({
  value,
  onChange,
  isCorrect,
  onMarkCorrect,
  letter,
}) => {
  const [format, setFormat] = useState<MathElementFormat>(() => detectMathFormat(value));
  const [showRawLatex, setShowRawLatex] = useState(false);

  // Sync format if value format changes externally (e.g. question switch)
  useEffect(() => {
    setFormat(detectMathFormat(value));
  }, [value]);

  // Parsed states
  const parsedMatrix = parseMatrix2x2(value) || { a: "1", b: "0", c: "0", d: "1" };
  const parsedVector = parseVector2(value) || { x: "1", y: "0" };

  const handleFormatChange = (newFormat: MathElementFormat) => {
    setFormat(newFormat);
    if (newFormat === "matrix_2x2") {
      onChange(buildMatrix2x2(parsedMatrix.a, parsedMatrix.b, parsedMatrix.c, parsedMatrix.d));
    } else if (newFormat === "vector_2d") {
      onChange(buildVector2(parsedVector.x, parsedVector.y));
    } else {
      // If switching to simple text/number, default to "4" or clean value if not a matrix
      const cleanVal = value.includes("\\begin") ? "4" : (value || "4");
      onChange(cleanVal);
    }
  };

  const handleMatrixCellChange = (cell: "a" | "b" | "c" | "d", val: string) => {
    const updated = { ...parsedMatrix, [cell]: val };
    onChange(buildMatrix2x2(updated.a, updated.b, updated.c, updated.d));
  };

  const handleVectorCellChange = (cell: "x" | "y", val: string) => {
    const updated = { ...parsedVector, [cell]: val };
    onChange(buildVector2(updated.x, updated.y));
  };

  return (
    <div
      className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2.5 ${
        isCorrect
          ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 shadow-md"
          : "bg-white/95 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
      }`}
    >
      {/* Top Header: Radio (mark correct) + Letter + Format switcher */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="radio"
            name="correctOptionRadio"
            checked={isCorrect}
            onChange={onMarkCorrect}
            className="w-4 h-4 text-emerald-500 accent-emerald-500 cursor-pointer"
          />
          <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
            Opción {letter})
          </span>
          {isCorrect && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 text-[11px] font-black flex items-center gap-1 shadow-xs">
              <Check className="w-3 h-3 stroke-[3]" />
              Respuesta Correcta
            </span>
          )}
        </label>

        {/* Format Selector: Simple Number / Text vs Matrix vs Vector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex p-0.5 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => handleFormatChange("scalar_text")}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                format === "scalar_text"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-300 dark:border-slate-700/60"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Type className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Texto / Número (ej: 4)
            </button>
            <button
              type="button"
              onClick={() => handleFormatChange("matrix_2x2")}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                format === "matrix_2x2"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-300 dark:border-slate-700/60"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Grid2X2 className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
              Matriz 2×2
            </button>
            <button
              type="button"
              onClick={() => handleFormatChange("vector_2d")}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                format === "vector_2d"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-300 dark:border-slate-700/60"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Columns2 className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
              Vector
            </button>
          </div>

          {/* Toggle raw latex for edge cases */}
          <button
            type="button"
            onClick={() => setShowRawLatex(!showRawLatex)}
            title="Alternar entre modo visual y código LaTeX"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Code2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      {showRawLatex ? (
        <div className="flex flex-col gap-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
            placeholder="Código LaTeX o texto"
          />
        </div>
      ) : (
        <div className="flex items-center justify-between flex-wrap gap-4 py-1">
          {/* Natural scalar / number input (e.g. 4, 2+2, x, whatever) */}
          {format === "scalar_text" && (
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Escribe la respuesta libre (ej: 4, 5, 2+2, -3 o texto)"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 text-base font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400"
              />
            </div>
          )}

          {/* Natural visual matrix inputs */}
          {format === "matrix_2x2" && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-3xl font-light text-slate-400 dark:text-slate-500 select-none pl-1">⎛</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    value={parsedMatrix.a}
                    onChange={(e) => handleMatrixCellChange("a", e.target.value)}
                    placeholder="0"
                    className="w-14 h-9 text-center font-bold text-sm bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 focus:border-emerald-500 text-slate-900 dark:text-white outline-none shadow-xs"
                    title="Fila 1, Columna 1"
                  />
                  <input
                    type="text"
                    value={parsedMatrix.b}
                    onChange={(e) => handleMatrixCellChange("b", e.target.value)}
                    placeholder="0"
                    className="w-14 h-9 text-center font-bold text-sm bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 focus:border-emerald-500 text-slate-900 dark:text-white outline-none shadow-xs"
                    title="Fila 1, Columna 2"
                  />
                  <input
                    type="text"
                    value={parsedMatrix.c}
                    onChange={(e) => handleMatrixCellChange("c", e.target.value)}
                    placeholder="0"
                    className="w-14 h-9 text-center font-bold text-sm bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 focus:border-emerald-500 text-slate-900 dark:text-white outline-none shadow-xs"
                    title="Fila 2, Columna 1"
                  />
                  <input
                    type="text"
                    value={parsedMatrix.d}
                    onChange={(e) => handleMatrixCellChange("d", e.target.value)}
                    placeholder="0"
                    className="w-14 h-9 text-center font-bold text-sm bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 focus:border-emerald-500 text-slate-900 dark:text-white outline-none shadow-xs"
                    title="Fila 2, Columna 2"
                  />
                </div>
                <span className="text-3xl font-light text-slate-400 dark:text-slate-500 select-none pr-1">⎞</span>
              </div>
              <button
                type="button"
                onClick={() => handleFormatChange("scalar_text")}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 underline font-semibold transition-colors"
              >
                Cambiar a respuesta simple (ej: 4)
              </button>
            </div>
          )}

          {/* Natural visual vector inputs */}
          {format === "vector_2d" && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-3xl font-light text-slate-400 dark:text-slate-500 select-none pl-1">⎛</span>
                <div className="flex flex-col gap-1.5">
                  <input
                    type="text"
                    value={parsedVector.x}
                    onChange={(e) => handleVectorCellChange("x", e.target.value)}
                    placeholder="x"
                    className="w-16 h-9 text-center font-bold text-sm bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 focus:border-emerald-500 text-slate-900 dark:text-white outline-none shadow-xs"
                    title="Componente X"
                  />
                  <input
                    type="text"
                    value={parsedVector.y}
                    onChange={(e) => handleVectorCellChange("y", e.target.value)}
                    placeholder="y"
                    className="w-16 h-9 text-center font-bold text-sm bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 focus:border-emerald-500 text-slate-900 dark:text-white outline-none shadow-xs"
                    title="Componente Y"
                  />
                </div>
                <span className="text-3xl font-light text-slate-400 dark:text-slate-500 select-none pr-1">⎞</span>
              </div>
              <button
                type="button"
                onClick={() => handleFormatChange("scalar_text")}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 underline font-semibold transition-colors"
              >
                Cambiar a respuesta simple (ej: 4)
              </button>
            </div>
          )}

          {/* Live KaTeX mini preview badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Vista:
            </span>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-300">
              <MathRenderer latex={value || "(vacío)"} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
