"use client";

import React, { useState } from "react";
import {
  Grid2X2,
  Columns2,
  Divide,
  Superscript,
  SquareRadical,
  X,
  Plus,
  Sparkles,
} from "lucide-react";

interface SymbolabPanelProps {
  onInsertText: (text: string) => void;
}

export const SymbolabPanel: React.FC<SymbolabPanelProps> = ({ onInsertText }) => {
  const [activeTab, setActiveTab] = useState<"matrices" | "algebra" | "symbols">("matrices");
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [showVectorModal, setShowVectorModal] = useState(false);
  const [showFractionModal, setShowFractionModal] = useState(false);

  // Mini-modal states for natural number insertion
  const [matA, setMatA] = useState("1");
  const [matB, setMatB] = useState("0");
  const [matC, setMatC] = useState("0");
  const [matD, setMatD] = useState("1");
  const [matName, setMatName] = useState("A");

  const [vecX, setVecX] = useState("1");
  const [vecY, setVecY] = useState("0");
  const [vecName, setVecName] = useState("v");

  const [fracNum, setFracNum] = useState("1");
  const [fracDen, setFracDen] = useState("2");

  const handleInsertMatrix = () => {
    const namePart = matName.trim() ? `${matName.trim()} = ` : "";
    const latex = `$$${namePart}\\begin{pmatrix} ${matA || "0"} & ${matB || "0"} \\\\ ${matC || "0"} & ${matD || "0"} \\end{pmatrix}$$`;
    onInsertText(` ${latex} `);
    setShowMatrixModal(false);
  };

  const handleInsertVector = () => {
    const namePart = vecName.trim() ? `${vecName.trim()} = ` : "";
    const latex = `$$${namePart}\\begin{pmatrix} ${vecX || "0"} \\\\ ${vecY || "0"} \\end{pmatrix}$$`;
    onInsertText(` ${latex} `);
    setShowVectorModal(false);
  };

  const handleInsertFraction = () => {
    const latex = `$\\frac{${fracNum || "1"}}{${fracDen || "2"}}$`;
    onInsertText(` ${latex} `);
    setShowFractionModal(false);
  };

  return (
    <div className="w-full bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-md flex flex-col gap-2.5 backdrop-blur-md">
      {/* Top Header: Symbolab Brand & Category Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[11px] font-black">
            ∑
          </div>
          <span className="text-xs font-black tracking-wide text-slate-800 dark:text-slate-200 uppercase">
            Panel Matemático Symbolab
          </span>
        </div>

        {/* Categories */}
        <div className="flex p-0.5 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 text-xs font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("matrices")}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeTab === "matrices"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-300 dark:border-slate-700/60"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Matrices y Vectores
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("algebra")}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeTab === "algebra"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-300 dark:border-slate-700/60"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Operaciones y Álgebra
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("symbols")}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeTab === "symbols"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-300 dark:border-slate-700/60"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Símbolos y Transformaciones
          </button>
        </div>
      </div>

      {/* Buttons Bar based on Active Tab */}
      <div className="flex items-center gap-2 flex-wrap">
        {activeTab === "matrices" && (
          <>
            <button
              type="button"
              onClick={() => setShowMatrixModal(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-400 dark:border-emerald-500/50 text-xs font-bold text-emerald-700 dark:text-emerald-300 shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Grid2X2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              + Matriz 2×2
            </button>

            <button
              type="button"
              onClick={() => setShowVectorModal(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-400 dark:border-emerald-500/50 text-xs font-bold text-emerald-700 dark:text-emerald-300 shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Columns2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              + Vector 2D
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" $\\det(A)$ ")}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs"
            >
              |A| det(A)
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" $A \\cdot v$ ")}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs"
            >
              A · v
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" $B \\cdot A$ ")}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs"
            >
              B · A
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" $A^{-1}$ ")}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs"
            >
              A⁻¹ (Inversa)
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" $A^{T}$ ")}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs"
            >
              Aᵀ (Transpuesta)
            </button>
          </>
        )}

        {activeTab === "algebra" && (
          <>
            <button
              type="button"
              onClick={() => setShowFractionModal(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-400 dark:border-emerald-500/50 text-xs font-bold text-emerald-700 dark:text-emerald-300 shadow-xs flex items-center gap-1.5"
            >
              <Divide className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              a/b (Fracción)
            </button>

            <button
              type="button"
              onClick={() => onInsertText("^{2}")}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs flex items-center gap-1"
            >
              <Superscript className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              x²
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" \\times ")}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-black text-slate-800 dark:text-slate-200 shadow-xs"
            >
              ×
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" \\cdot ")}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-black text-slate-800 dark:text-slate-200 shadow-xs"
            >
              ·
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" \\pm ")}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs"
            >
              ±
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" = ")}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs"
            >
              =
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" \\neq ")}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs"
            >
              ≠
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" \\sqrt{x} ")}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs flex items-center gap-1"
            >
              <SquareRadical className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              √x
            </button>
          </>
        )}

        {activeTab === "symbols" && (
          <>
            <button
              type="button"
              onClick={() => onInsertText(" $\\mathbb{R}^2$ ")}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-black text-emerald-600 dark:text-emerald-400 shadow-xs"
            >
              ℝ²
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" $T(v)$ ")}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs"
            >
              T(v)
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" $T(e_1), T(e_2)$ ")}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs"
            >
              e₁, e₂ (Canónica)
            </button>

            <button
              type="button"
              onClick={() => onInsertText("$90^{\\circ}$")}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs"
            >
              90°
            </button>

            <button
              type="button"
              onClick={() => onInsertText("$180^{\\circ}$")}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs"
            >
              180°
            </button>

            <button
              type="button"
              onClick={() => onInsertText("$270^{\\circ}$")}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs"
            >
              270°
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" $\\theta$ ")}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs"
            >
              θ (Ángulo)
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" $\\lambda$ ")}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs"
            >
              λ (Autovalor)
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" $k$ ")}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs"
            >
              k (Escalar)
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" **texto en negrita** ")}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs"
            >
              Negrita
            </button>
          </>
        )}
      </div>

      {/* POPUP MODAL: Insert Matrix 2x2 with Natural Numbers */}
      {showMatrixModal && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/60 shadow-2xl flex flex-col gap-3 animate-fade-in text-slate-900 dark:text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Grid2X2 className="w-4 h-4" />
              Escribe los 4 números de la Matriz 2×2:
            </span>
            <button
              type="button"
              onClick={() => setShowMatrixModal(false)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Nombre:</label>
              <input
                type="text"
                value={matName}
                onChange={(e) => setMatName(e.target.value)}
                placeholder="A"
                className="w-10 h-8 text-center font-bold text-sm bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
              <span className="text-sm font-bold text-slate-500 dark:text-slate-300">=</span>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-3xl font-light text-slate-400 dark:text-slate-500 select-none pl-1">⎛</span>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  value={matA}
                  onChange={(e) => setMatA(e.target.value)}
                  placeholder="0"
                  className="w-12 h-8 text-center font-bold text-sm bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  value={matB}
                  onChange={(e) => setMatB(e.target.value)}
                  placeholder="0"
                  className="w-12 h-8 text-center font-bold text-sm bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  value={matC}
                  onChange={(e) => setMatC(e.target.value)}
                  placeholder="0"
                  className="w-12 h-8 text-center font-bold text-sm bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  value={matD}
                  onChange={(e) => setMatD(e.target.value)}
                  placeholder="0"
                  className="w-12 h-8 text-center font-bold text-sm bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>
              <span className="text-3xl font-light text-slate-400 dark:text-slate-500 select-none pr-1">⎞</span>
            </div>

            <button
              type="button"
              onClick={handleInsertMatrix}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-black shadow-md shadow-emerald-950/20 transition-all active:scale-95"
            >
              Insertar en el texto
            </button>
          </div>
        </div>
      )}

      {/* POPUP MODAL: Insert Vector 2D */}
      {showVectorModal && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/60 shadow-2xl flex flex-col gap-3 animate-fade-in text-slate-900 dark:text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Columns2 className="w-4 h-4" />
              Escribe las componentes del Vector:
            </span>
            <button
              type="button"
              onClick={() => setShowVectorModal(false)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Nombre:</label>
              <input
                type="text"
                value={vecName}
                onChange={(e) => setVecName(e.target.value)}
                placeholder="v"
                className="w-10 h-8 text-center font-bold text-sm bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
              <span className="text-sm font-bold text-slate-500 dark:text-slate-300">=</span>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-3xl font-light text-slate-400 dark:text-slate-500 select-none pl-1">⎛</span>
              <div className="flex flex-col gap-1.5">
                <input
                  type="text"
                  value={vecX}
                  onChange={(e) => setVecX(e.target.value)}
                  placeholder="x"
                  className="w-14 h-8 text-center font-bold text-sm bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  value={vecY}
                  onChange={(e) => setVecY(e.target.value)}
                  placeholder="y"
                  className="w-14 h-8 text-center font-bold text-sm bg-slate-900 rounded-lg border border-slate-700 text-white outline-none focus:border-emerald-400"
                />
              </div>
              <span className="text-3xl font-light text-slate-500 select-none pr-1">⎞</span>
            </div>

            <button
              type="button"
              onClick={handleInsertVector}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-md shadow-emerald-950/50 transition-all active:scale-95"
            >
              Insertar Vector
            </button>
          </div>
        </div>
      )}

      {/* POPUP MODAL: Insert Fraction */}
      {showFractionModal && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/60 shadow-2xl flex flex-col gap-3 animate-fade-in text-slate-900 dark:text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Divide className="w-4 h-4" />
              Escribe el Numerador y Denominador:
            </span>
            <button
              type="button"
              onClick={() => setShowFractionModal(false)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex flex-col items-center gap-1">
              <input
                type="text"
                value={fracNum}
                onChange={(e) => setFracNum(e.target.value)}
                placeholder="Num"
                className="w-16 h-8 text-center font-bold text-sm bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
              <div className="w-16 h-0.5 bg-slate-300 dark:bg-slate-700" />
              <input
                type="text"
                value={fracDen}
                onChange={(e) => setFracDen(e.target.value)}
                placeholder="Den"
                className="w-16 h-8 text-center font-bold text-sm bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="button"
              onClick={handleInsertFraction}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-black shadow-md shadow-emerald-950/20 transition-all active:scale-95"
            >
              Insertar Fracción
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
