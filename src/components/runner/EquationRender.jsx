import React, { useEffect, useState, useRef } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import EquationGraph from './visualizers/EquationGraph';

export default function EquationRender({ state }) {
  const safeState = state || { lhs: "x", rhs: "0", sign: "=", initialLhs: "x", initialRhs: "0", history: [] };
  const [displayState, setDisplayState] = useState(safeState);
  const [animating, setAnimating] = useState(false);
  
  const [verifStep, setVerifStep] = useState(0);
  const [showGraph, setShowGraph] = useState(false);

  const isImplicit = state?.implicit === true;
  const canShowGraph = state?.showGraph === true;
  const isModified = (displayState.history || []).length > 0;

  // ... (Fonctions formatForLatex, formatOp, formatSubstitution INCHANGÉES) ...
  const formatForLatex = (expression) => {
    if (!expression) return "";
    let tex = String(expression);
    if (isImplicit) {
        tex = tex.replace(/(\d)\s*\*\s*([a-zA-Z])/g, '$1$2');
        tex = tex.replace(/\b1([a-zA-Z])/g, '$1');
        tex = tex.replace(/\*/g, '\\times ');
    } else {
        tex = tex.replace(/\*/g, '\\times ');
    }
    return tex;
  };
  const formatOp = (op) => { if (op === '*') return '\\times'; if (op === '/') return '\\div'; return op; };
  const formatSubstitution = (expr, val) => {
      if (!expr) return "";
      let str = String(expr);
      let tex = str.replace(/\*/g, ' \\times ');
      tex = tex.replace(/(\d)\s*x/g, '$1 \\times x');
      const displayVal = val < 0 ? `(${val})` : val;
      const replacement = `{\\color{#3498db}\\mathbf{${displayVal}}}`;
      return tex.replace(/x/g, replacement);
  };

  // --- ORCHESTRATION ---
  useEffect(() => {
    if (state && state.lastOp && !state.lastOp.error) {
      setAnimating(true);
      setVerifStep(0);
      const timer = setTimeout(() => {
        setAnimating(false);
        setDisplayState(state);
      }, 2000); 
      return () => { clearTimeout(timer); setAnimating(false); setDisplayState(state); };
    } 
    else if (state && state.verification) {
        setAnimating(false);
        setDisplayState(state);
        
        setVerifStep(1); // T=0
        const t1 = setTimeout(() => setVerifStep(2), 1500); // T+1.5s
        const t2 = setTimeout(() => setVerifStep(3), 3500); // T+3.5s
        
        // Note : Pour les inéquations, on n'affiche pas S=... automatiquement ici
        // C'est à l'élève de le construire. Donc pas de passage à l'étape 4 auto.
        const t3 = setTimeout(() => { 
            if (state.finalSolutionLatex) setVerifStep(4); 
        }, 5000);

        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
    else if (state && state.solutionState) {
        setDisplayState(state);
        setVerifStep(4); 
    }
    else if (state) {
      setAnimating(false);
      setDisplayState(state);
      setVerifStep(0);
    }
  }, [state]);

  // ... (Reste Graphique inchangé) ...
  // ... (Début Render inchangé) ...
  
  let lhsTex = formatForLatex(displayState.lhs);
  let rhsTex = formatForLatex(displayState.rhs);
  const signTex = String(displayState.sign || "=");
  if (animating && state.lastOp) {
      const valTex = formatForLatex(state.lastOp.val);
      const opTex = `{\\color{#e74c3c} \\quad ${formatOp(state.lastOp.op)} \\; ${valTex}}`;
      lhsTex = `${lhsTex} ${opTex}`;
      rhsTex = `${rhsTex} ${opTex}`;
  }

  return (
    <div className="w-full h-full bg-white flex flex-col font-sans relative overflow-y-auto custom-scrollbar">
      <div className="flex-1 flex flex-col items-center py-6 px-4 gap-6">
          
          {/* Équation Principale */}
          <div className="w-full overflow-x-auto flex justify-center pb-2">
            <div className="flex items-center gap-3 text-2xl md:text-3xl text-slate-700 whitespace-nowrap font-serif transition-all duration-500">
                <div className="bg-slate-50 px-4 py-3 rounded-xl border-b-4 border-blue-200 shadow-sm min-w-[80px] text-center">
                   {lhsTex ? <InlineMath math={lhsTex} /> : <span className="text-slate-300">?</span>}
                </div>
                <div className="text-slate-400 font-bold"><InlineMath math={signTex} /></div>
                <div className="bg-slate-50 px-4 py-3 rounded-xl border-b-4 border-red-200 shadow-sm min-w-[80px] text-center">
                   {rhsTex ? <InlineMath math={rhsTex} /> : <span className="text-slate-300">?</span>}
                </div>
            </div>
          </div>

          {/* ZONE VÉRIFICATION AVEC MESSAGE PÉDAGOGIQUE */}
          {verifStep > 0 && state.verification && (
              <div className="w-full max-w-lg bg-white rounded-xl border-2 border-blue-100 p-0 overflow-hidden shadow-sm animate-in slide-in-from-top-4 duration-500">
                  <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex justify-between items-center">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Vérification</span>
                      <span className="text-xs font-mono bg-white px-2 py-1 rounded text-blue-800 border border-blue-200">x = {state.verification.testVal}</span>
                  </div>
                  
                  <div className="p-4 flex flex-col gap-4 text-sm">
                      <div className={`flex items-center gap-3 ${verifStep >= 1 ? 'opacity-100' : 'opacity-0'}`}>
                          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">1</div>
                          <div className="font-mono text-slate-500">
                             <InlineMath math={`${formatForLatex(state.verification.originLhs)} ${state.verification.checkSign} ${formatForLatex(state.verification.originRhs)}`} />
                          </div>
                      </div>
                      <div className={`flex items-center gap-3 ${verifStep >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">2</div>
                          <div className="font-mono">
                             <InlineMath math={`${formatSubstitution(state.verification.originLhs, state.verification.testVal)} ${state.verification.checkSign} ${formatSubstitution(state.verification.originRhs, state.verification.testVal)}`} />
                          </div>
                      </div>
                      <div className={`flex items-center gap-3 ${verifStep >= 3 ? 'opacity-100' : 'opacity-0'}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${state.verification.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>3</div>
                          <div className="flex-1 flex flex-col gap-2">
                              <div className="flex items-center justify-between bg-slate-50 p-2 rounded">
                                 <span className="font-bold font-mono text-slate-700">
                                    {state.verification.valLhs} {state.verification.checkSign} {state.verification.valRhs}
                                 </span>
                                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${state.verification.isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                     {state.verification.isCorrect ? "VRAI" : "FAUX"}
                                 </span>
                              </div>
                              {/* MESSAGE PÉDAGOGIQUE (INCLURE/EXCLURE) */}
                              {state.verification.feedbackMsg && (
                                  <div className="text-xs italic text-slate-500 bg-blue-50/50 p-2 rounded border border-blue-100">
                                      💡 {state.verification.feedbackMsg}
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* ... (Reste Solution Finale, Erreur, Graphique, Historique INCHANGÉS) ... */}
          {state.finalSolutionLatex && verifStep === 4 && (
              <div className="animate-in zoom-in duration-500 bg-emerald-50 text-emerald-900 px-6 py-3 rounded-xl border border-emerald-200 shadow-md mt-2">
                  <div className="text-2xl font-bold text-center">
                      <InlineMath math={state.finalSolutionLatex} />
                  </div>
              </div>
          )}
          
          {/* COMPOSANT GRAPHIQUE */}
          <EquationGraph 
             lhs={displayState.lhs} rhs={displayState.rhs} 
             initialLhs={displayState.initialLhs} initialRhs={displayState.initialRhs}
             isVisible={canShowGraph && showGraph && !state.finalSolutionLatex} 
             isModified={isModified}
          />
          
           {/* ... (Bouton et Historique inchangés) */}
      </div>
    </div>
  );
}