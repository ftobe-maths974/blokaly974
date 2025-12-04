import React, { useEffect, useState } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

export default function EquationRender({ state }) {
  const safeState = state || { lhs: "", rhs: "", sign: "=" };
  const [displayState, setDisplayState] = useState(safeState);
  const [animating, setAnimating] = useState(false);

  // L'option est maintenant bien présente grâce au correctif du plugin
  const isImplicit = state?.implicit === true;

  const formatForLatex = (expression) => {
    if (!expression) return "";
    let tex = String(expression);

    if (isImplicit) {
        // 1. "2*x" devient "2x"
        tex = tex.replace(/(\d)\s*\*\s*([a-zA-Z])/g, '$1$2');
        // 2. Nettoyage du "1x" -> "x" (Optionnel mais plus élégant)
        tex = tex.replace(/\b1([a-zA-Z])/g, '$1');
        // 3. Les autres multiplications deviennent invisibles ou des points, 
        // mais pour l'instant on garde \times entre deux nombres pour éviter la confusion (2*3 != 23)
        tex = tex.replace(/\*/g, '\\times ');
    } else {
        // Mode Explicite : Le "*" devient le joli symbole croix
        tex = tex.replace(/\*/g, '\\times ');
    }
    return tex;
  };

  const formatOp = (op) => {
    if (op === '*') return '\\times';
    if (op === '/') return '\\div';
    return op;
  };

  useEffect(() => {
    if (state && state.lastOp) {
      setAnimating(true);
      // On attend 2.5s pour laisser l'élève lire l'opération avant le résultat
      const timer = setTimeout(() => {
        setAnimating(false);
        setDisplayState(state);
      }, 2500); 
      return () => clearTimeout(timer);
    } else if (state) {
      setDisplayState(state);
    }
  }, [state]);

  let lhsTex = formatForLatex(displayState.lhs);
  let rhsTex = formatForLatex(displayState.rhs);
  const signTex = String(displayState.sign || "=");

  if (animating && state.lastOp) {
    // CORRECTION : On formate aussi la valeur rouge !
    // Comme ça "1*x" deviendra "x" (si implicite) ou "1 \times x"
    const valTex = formatForLatex(state.lastOp.val);
    
    const opTex = `{\\color{#e74c3c} \\quad ${formatOp(state.lastOp.op)} \\; ${valTex}}`;
    lhsTex = `${lhsTex} ${opTex}`;
    rhsTex = `${rhsTex} ${opTex}`;
  }

  return (
    <div className="w-full h-full bg-white flex flex-col justify-center items-center font-sans relative overflow-hidden">
      
      {/* Conteneur fluide avec scroll si nécessaire */}
      <div className="w-full overflow-x-auto flex justify-center p-4 custom-scrollbar">
          <div className="flex items-center gap-4 text-3xl md:text-4xl text-slate-700 animate-in fade-in duration-500 whitespace-nowrap">
            
            {/* Membre de Gauche */}
            <div className="bg-slate-50 px-6 py-4 rounded-2xl border-b-4 border-slate-200 shadow-sm min-w-[120px] text-center flex items-center justify-center">
               {lhsTex ? <InlineMath math={lhsTex} /> : <span className="text-slate-300 text-2xl">?</span>}
            </div>
            
            {/* Signe */}
            <div className="text-slate-400 font-bold text-2xl">
               <InlineMath math={signTex} />
            </div>

            {/* Membre de Droite */}
            <div className="bg-slate-50 px-6 py-4 rounded-2xl border-b-4 border-slate-200 shadow-sm min-w-[120px] text-center flex items-center justify-center">
               {rhsTex ? <InlineMath math={rhsTex} /> : <span className="text-slate-300 text-2xl">?</span>}
            </div>

          </div>
      </div>
      
      <div className="mt-8 text-slate-400 italic text-sm font-medium h-6">
        {animating ? "Calcul en cours..." : "En attente d'instructions"}
      </div>
    </div>
  );
}