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
import { Check, Code2, Eye } from "lucide-react";

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
      onChange("1");
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
      className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col gap-2.5 ${
        isCorrect
          ? "bg-[#e8f5e9]/70 border-[#218653] shadow-xs"
          : "bg-white border-[#dce6ef] hover:border-[#cbd5e1]"
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
            className="w-4 h-4 text-[#218653] accent-[#218653] cursor-pointer"
          />
          <span className="font-mono font-black text-sm text-[#23395b]">
            Opción {letter})
          </span>
          {isCorrect && (
            <span className="px-2 py-0.5 rounded-md bg-[#218653] text-white text-[11px] font-bold flex items-center gap-1 shadow-xs">
              <Check className="w-3 h-3" />
              Respuesta Correcta
            </span>
          )}
        </label>

        <div className="flex items-center gap-1.5">
          {/* Format pills */}
          <div className="flex p-0.5 rounded-lg bg-[#f1f5f9] text-[11px] font-bold">
            <button
              type="button"
              onClick={() => handleFormatChange("matrix_2x2")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                format === "matrix_2x2"
                  ? "bg-white text-[#23395b] shadow-xs"
                  : "text-[#64748b] hover:text-[#23395b]"
              }`}
            >
              Matriz 2×2
            </button>
            <button
              type="button"
              onClick={() => handleFormatChange("vector_2d")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                format === "vector_2d"
                  ? "bg-white text-[#23395b] shadow-xs"
                  : "text-[#64748b] hover:text-[#23395b]"
              }`}
            >
              Vector
            </button>
            <button
              type="button"
              onClick={() => handleFormatChange("scalar_text")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                format === "scalar_text"
                  ? "bg-white text-[#23395b] shadow-xs"
                  : "text-[#64748b] hover:text-[#23395b]"
              }`}
            >
              Número / Texto
            </button>
          </div>

          {/* Toggle raw latex for advanced users */}
          <button
            type="button"
            onClick={() => setShowRawLatex(!showRawLatex)}
            title="Alternar entre editor visual y código LaTeX"
            className="p-1.5 rounded-lg text-[#64748b] hover:bg-[#eef4fa] transition-colors"
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
            className="w-full px-3 py-2 rounded-xl border border-[#dce6ef] bg-[#f8fafc] font-mono text-xs text-[#23395b] outline-none"
            placeholder="Código LaTeX (ej: \begin{pmatrix} 1 & 0 \\ 0 & 1 \end{pmatrix})"
          />
          <span className="text-[10px] text-[#94a3b8]">Modo avanzado de código directo</span>
        </div>
      ) : (
        <div className="flex items-center justify-between flex-wrap gap-4 py-1">
          {/* Natural visual matrix inputs */}
          {format === "matrix_2x2" && (
            <div className="flex items-center gap-1.5 bg-[#f8fafc] p-2 rounded-xl border border-[#e2e8f0]">
              <span className="text-3xl font-light text-[#64748b] select-none pl-1">⎛</span>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  value={parsedMatrix.a}
                  onChange={(e) => handleMatrixCellChange("a", e.target.value)}
                  placeholder="0"
                  className="w-14 h-9 text-center font-bold text-sm bg-white rounded-lg border border-[#cbd5e1] focus:border-[#23395b] text-[#23395b] outline-none shadow-xs"
                  title="Fila 1, Columna 1"
                />
                <input
                  type="text"
                  value={parsedMatrix.b}
                  onChange={(e) => handleMatrixCellChange("b", e.target.value)}
                  placeholder="0"
                  className="w-14 h-9 text-center font-bold text-sm bg-white rounded-lg border border-[#cbd5e1] focus:border-[#23395b] text-[#23395b] outline-none shadow-xs"
                  title="Fila 1, Columna 2"
                />
                <input
                  type="text"
                  value={parsedMatrix.c}
                  onChange={(e) => handleMatrixCellChange("c", e.target.value)}
                  placeholder="0"
                  className="w-14 h-9 text-center font-bold text-sm bg-white rounded-lg border border-[#cbd5e1] focus:border-[#23395b] text-[#23395b] outline-none shadow-xs"
                  title="Fila 2, Columna 1"
                />
                <input
                  type="text"
                  value={parsedMatrix.d}
                  onChange={(e) => handleMatrixCellChange("d", e.target.value)}
                  placeholder="0"
                  className="w-14 h-9 text-center font-bold text-sm bg-white rounded-lg border border-[#cbd5e1] focus:border-[#23395b] text-[#23395b] outline-none shadow-xs"
                  title="Fila 2, Columna 2"
                />
              </div>
              <span className="text-3xl font-light text-[#64748b] select-none pr-1">⎞</span>
            </div>
          )}

          {/* Natural visual vector inputs */}
          {format === "vector_2d" && (
            <div className="flex items-center gap-1.5 bg-[#f8fafc] p-2 rounded-xl border border-[#e2e8f0]">
              <span className="text-3xl font-light text-[#64748b] select-none pl-1">⎛</span>
              <div className="flex flex-col gap-1.5">
                <input
                  type="text"
                  value={parsedVector.x}
                  onChange={(e) => handleVectorCellChange("x", e.target.value)}
                  placeholder="x"
                  className="w-16 h-9 text-center font-bold text-sm bg-white rounded-lg border border-[#cbd5e1] focus:border-[#23395b] text-[#23395b] outline-none shadow-xs"
                  title="Componente X"
                />
                <input
                  type="text"
                  value={parsedVector.y}
                  onChange={(e) => handleVectorCellChange("y", e.target.value)}
                  placeholder="y"
                  className="w-16 h-9 text-center font-bold text-sm bg-white rounded-lg border border-[#cbd5e1] focus:border-[#23395b] text-[#23395b] outline-none shadow-xs"
                  title="Componente Y"
                />
              </div>
              <span className="text-3xl font-light text-[#64748b] select-none pr-1">⎞</span>
            </div>
          )}

          {/* Natural scalar / number input */}
          {format === "scalar_text" && (
            <div className="flex-1 max-w-sm">
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Escribe el número o valor (ej: 5, -2, 3/4)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] bg-[#f8fafc] focus:bg-white text-sm font-bold text-[#23395b] outline-none"
              />
            </div>
          )}

          {/* Live KaTeX mini preview badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#e2e8f0] shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
              Vista:
            </span>
            <div className="text-sm font-bold text-[#23395b]">
              <MathRenderer latex={value} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
