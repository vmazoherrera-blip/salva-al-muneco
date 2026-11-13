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
    <div className="w-full bg-[#f8fafc] border-2 border-[#dce6ef] rounded-2xl p-3 shadow-xs flex flex-col gap-2.5">
      {/* Top Header: Symbolab Brand & Category Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#e2e8f0]">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-[#23395b] text-white flex items-center justify-center text-[11px] font-black">
            ∑
          </div>
          <span className="text-xs font-black tracking-wide text-[#23395b] uppercase">
            Panel Matemático Symbolab
          </span>
        </div>

        {/* Categories */}
        <div className="flex p-0.5 rounded-xl bg-[#e2ecf5] text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("matrices")}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeTab === "matrices"
                ? "bg-white text-[#23395b] shadow-xs"
                : "text-[#64748b] hover:text-[#23395b]"
            }`}
          >
            Matrices y Vectores
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("algebra")}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeTab === "algebra"
                ? "bg-white text-[#23395b] shadow-xs"
                : "text-[#64748b] hover:text-[#23395b]"
            }`}
          >
            Operaciones y Álgebra
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("symbols")}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeTab === "symbols"
                ? "bg-white text-[#23395b] shadow-xs"
                : "text-[#64748b] hover:text-[#23395b]"
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
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#eef4fa] border-2 border-[#23395b]/30 text-xs font-bold text-[#23395b] shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Grid2X2 className="w-3.5 h-3.5 text-[#218653]" />
              + Matriz 2×2
            </button>

            <button
              type="button"
              onClick={() => setShowVectorModal(true)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#eef4fa] border-2 border-[#23395b]/30 text-xs font-bold text-[#23395b] shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Columns2 className="w-3.5 h-3.5 text-[#218653]" />
              + Vector 2D
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" $\\det(A)$ ")}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#eef4fa] border border-[#dce6ef] text-xs font-bold text-[#23395b] shadow-xs"
            >
              |A| det(A)
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" $A \\cdot v$ ")}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#eef4fa] border border-[#dce6ef] text-xs font-bold text-[#23395b] shadow-xs"
            >
              A · v
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" $B \\cdot A$ ")}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#eef4fa] border border-[#dce6ef] text-xs font-bold text-[#23395b] shadow-xs"
            >
              B · A
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" $A^{-1}$ ")}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#eef4fa] border border-[#dce6ef] text-xs font-bold text-[#23395b] shadow-xs"
            >
              A⁻¹ (Inversa)
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" $A^{T}$ ")}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#eef4fa] border border-[#dce6ef] text-xs font-bold text-[#23395b] shadow-xs"
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
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#eef4fa] border border-[#dce6ef] text-xs font-bold text-[#23395b] shadow-xs flex items-center gap-1.5"
            >
              <Divide className="w-3.5 h-3.5 text-[#218653]" />
              a/b (Fracción)
            </button>

            <button
              type="button"
              onClick={() => onInsertText("^{2}")}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#eef4fa] border border-[#dce6ef] text-xs font-bold text-[#23395b] shadow-xs flex items-center gap-1"
            >
              <Superscript className="w-3.5 h-3.5" />
              x²
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" \\times ")}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#eef4fa] border border-[#dce6ef] text-xs font-black text-[#23395b] shadow-xs"
            >
              ×
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" \\cdot ")}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#eef4fa] border border-[#dce6ef] text-xs font-black text-[#23395b] shadow-xs"
            >
              ·
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" \\pm ")}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#eef4fa] border border-[#dce6ef] text-xs font-bold text-[#23395b] shadow-xs"
            >
              ±
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" = ")}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#eef4fa] border border-[#dce6ef] text-xs font-bold text-[#23395b] shadow-xs"
            >
              =
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" \\neq ")}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#eef4fa] border border-[#dce6ef] text-xs font-bold text-[#23395b] shadow-xs"
            >
              ≠
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" \\sqrt{x} ")}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#eef4fa] border border-[#dce6ef] text-xs font-bold text-[#23395b] shadow-xs flex items-center gap-1"
            >
              <SquareRadical className="w-3.5 h-3.5" />
              √x
            </button>
          </>
        )}

        {activeTab === "symbols" && (
          <>
            <button
              type="button"
              onClick={() => onInsertText(" $\\mathbb{R}^2$ ")}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#eef4fa] border border-[#dce6ef] text-xs font-black text-[#23395b] shadow-xs"
            >
              ℝ²
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" $T(v)$ ")}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#eef4fa] border border-[#dce6ef] text-xs font-bold text-[#23395b] shadow-xs"
            >
              T(v)
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" $T(e_1), T(e_2)$ ")}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#eef4fa] border border-[#dce6ef] text-xs font-bold text-[#23395b] shadow-xs"
            >
              e₁, e₂ (Canónica)
            </button>

            <button
              type="button"
              onClick={() => onInsertText("$90^{\\circ}$")}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#eef4fa] border border-[#dce6ef] text-xs font-bold text-[#23395b] shadow-xs"
            >
              90°
            </button>

            <button
              type="button"
              onClick={() => onInsertText("$180^{\\circ}$")}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#eef4fa] border border-[#dce6ef] text-xs font-bold text-[#23395b] shadow-xs"
            >
              180°
            </button>

            <button
              type="button"
              onClick={() => onInsertText("$270^{\\circ}$")}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#eef4fa] border border-[#dce6ef] text-xs font-bold text-[#23395b] shadow-xs"
            >
              270°
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" $\\theta$ ")}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#eef4fa] border border-[#dce6ef] text-xs font-bold text-[#23395b] shadow-xs"
            >
              θ (Ángulo)
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" $\\lambda$ ")}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#eef4fa] border border-[#dce6ef] text-xs font-bold text-[#23395b] shadow-xs"
            >
              λ (Autovalor)
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" $k$ ")}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#eef4fa] border border-[#dce6ef] text-xs font-bold text-[#23395b] shadow-xs"
            >
              k (Escalar)
            </button>

            <button
              type="button"
              onClick={() => onInsertText(" **texto en negrita** ")}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#eef4fa] border border-[#dce6ef] text-xs font-bold text-[#23395b] shadow-xs"
            >
              Negrita
            </button>
          </>
        )}
      </div>

      {/* POPUP MODAL: Insert Matrix 2x2 with Natural Numbers */}
      {showMatrixModal && (
        <div className="p-4 rounded-xl bg-white border-2 border-[#218653] shadow-md flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#218653] flex items-center gap-1.5">
              <Grid2X2 className="w-4 h-4" />
              Escribe los 4 números de la Matriz 2×2:
            </span>
            <button
              type="button"
              onClick={() => setShowMatrixModal(false)}
              className="text-[#64748b] hover:text-[#23395b]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <label className="text-xs font-bold text-[#64748b]">Nombre:</label>
              <input
                type="text"
                value={matName}
                onChange={(e) => setMatName(e.target.value)}
                placeholder="A"
                className="w-10 h-8 text-center font-bold text-sm bg-[#f8fafc] border border-[#cbd5e1] rounded-lg text-[#23395b] outline-none"
              />
              <span className="text-sm font-bold text-[#23395b]">=</span>
            </div>

            <div className="flex items-center gap-1 bg-[#f8fafc] p-2 rounded-xl border border-[#cbd5e1]">
              <span className="text-3xl font-light text-[#64748b] select-none pl-1">⎛</span>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  value={matA}
                  onChange={(e) => setMatA(e.target.value)}
                  placeholder="0"
                  className="w-12 h-8 text-center font-bold text-sm bg-white rounded-lg border border-[#cbd5e1] text-[#23395b] outline-none"
                />
                <input
                  type="text"
                  value={matB}
                  onChange={(e) => setMatB(e.target.value)}
                  placeholder="0"
                  className="w-12 h-8 text-center font-bold text-sm bg-white rounded-lg border border-[#cbd5e1] text-[#23395b] outline-none"
                />
                <input
                  type="text"
                  value={matC}
                  onChange={(e) => setMatC(e.target.value)}
                  placeholder="0"
                  className="w-12 h-8 text-center font-bold text-sm bg-white rounded-lg border border-[#cbd5e1] text-[#23395b] outline-none"
                />
                <input
                  type="text"
                  value={matD}
                  onChange={(e) => setMatD(e.target.value)}
                  placeholder="0"
                  className="w-12 h-8 text-center font-bold text-sm bg-white rounded-lg border border-[#cbd5e1] text-[#23395b] outline-none"
                />
              </div>
              <span className="text-3xl font-light text-[#64748b] select-none pr-1">⎞</span>
            </div>

            <button
              type="button"
              onClick={handleInsertMatrix}
              className="px-4 py-2 rounded-xl bg-[#218653] hover:bg-[#1a6e43] text-white text-xs font-bold shadow-xs transition-all"
            >
              Insertar en el texto
            </button>
          </div>
        </div>
      )}

      {/* POPUP MODAL: Insert Vector 2D */}
      {showVectorModal && (
        <div className="p-4 rounded-xl bg-white border-2 border-[#218653] shadow-md flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#218653] flex items-center gap-1.5">
              <Columns2 className="w-4 h-4" />
              Escribe las componentes del Vector:
            </span>
            <button
              type="button"
              onClick={() => setShowVectorModal(false)}
              className="text-[#64748b] hover:text-[#23395b]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <label className="text-xs font-bold text-[#64748b]">Nombre:</label>
              <input
                type="text"
                value={vecName}
                onChange={(e) => setVecName(e.target.value)}
                placeholder="v"
                className="w-10 h-8 text-center font-bold text-sm bg-[#f8fafc] border border-[#cbd5e1] rounded-lg text-[#23395b] outline-none"
              />
              <span className="text-sm font-bold text-[#23395b]">=</span>
            </div>

            <div className="flex items-center gap-1 bg-[#f8fafc] p-2 rounded-xl border border-[#cbd5e1]">
              <span className="text-3xl font-light text-[#64748b] select-none pl-1">⎛</span>
              <div className="flex flex-col gap-1.5">
                <input
                  type="text"
                  value={vecX}
                  onChange={(e) => setVecX(e.target.value)}
                  placeholder="x"
                  className="w-14 h-8 text-center font-bold text-sm bg-white rounded-lg border border-[#cbd5e1] text-[#23395b] outline-none"
                />
                <input
                  type="text"
                  value={vecY}
                  onChange={(e) => setVecY(e.target.value)}
                  placeholder="y"
                  className="w-14 h-8 text-center font-bold text-sm bg-white rounded-lg border border-[#cbd5e1] text-[#23395b] outline-none"
                />
              </div>
              <span className="text-3xl font-light text-[#64748b] select-none pr-1">⎞</span>
            </div>

            <button
              type="button"
              onClick={handleInsertVector}
              className="px-4 py-2 rounded-xl bg-[#218653] hover:bg-[#1a6e43] text-white text-xs font-bold shadow-xs transition-all"
            >
              Insertar Vector
            </button>
          </div>
        </div>
      )}

      {/* POPUP MODAL: Insert Fraction */}
      {showFractionModal && (
        <div className="p-4 rounded-xl bg-white border-2 border-[#218653] shadow-md flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#218653] flex items-center gap-1.5">
              <Divide className="w-4 h-4" />
              Escribe el Numerador y Denominador:
            </span>
            <button
              type="button"
              onClick={() => setShowFractionModal(false)}
              className="text-[#64748b] hover:text-[#23395b]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <input
                type="text"
                value={fracNum}
                onChange={(e) => setFracNum(e.target.value)}
                placeholder="Num"
                className="w-16 h-8 text-center font-bold text-sm bg-[#f8fafc] border border-[#cbd5e1] rounded-lg text-[#23395b] outline-none"
              />
              <div className="w-16 h-0.5 bg-[#23395b]" />
              <input
                type="text"
                value={fracDen}
                onChange={(e) => setFracDen(e.target.value)}
                placeholder="Den"
                className="w-16 h-8 text-center font-bold text-sm bg-[#f8fafc] border border-[#cbd5e1] rounded-lg text-[#23395b] outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleInsertFraction}
              className="px-4 py-2 rounded-xl bg-[#218653] hover:bg-[#1a6e43] text-white text-xs font-bold shadow-xs transition-all"
            >
              Insertar Fracción
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
