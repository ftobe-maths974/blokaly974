import React, { useEffect, useState, useRef } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import EquationGraph from './EquationGraph';

export default function EquationRunner({ state }) {
  // Valeurs par défaut
  const defaultState = { lhs: "x", rhs: "0", sign: "=", initialLhs: "x", initialRhs: "0", history: [] };
  const displayState = state || defaultState;
  
  const [animating, setAnimating] = useState(false);
  const [verifStep, setVerifStep] = useState(0);
  
  // Scroll auto vers le bas quand l'historique grandit
  const containerRef = useRef(null);
  useEffect(() => {
      if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
  }, [displayState.history?.length, verifStep]);

  const isImplicit = state?.implicit === true;
  const canShowGraph = state?.showGraph === true;
  const isModified = (displayState.history || []).length > 0;

  // --- FORMATEURS LATEX ---
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

  // --- GESTION ANIMATIONS ---
  // Effet d'animation déclenché par un changement de `state` : les setState dans
  // l'effet sont volontaires (séquençage temporisé des étapes de résolution).
  useEffect(() => {
    if (state && state.lastOp && !state.lastOp.error) {
      setAnimating(true);
      setVerifStep(0);
      const timer = setTimeout(() => {
        setAnimating(false);
      }, 1000); // Animation un peu plus rapide
      return () => clearTimeout(timer);
    } 
    else if (state && state.verification) {
        setAnimating(false);
        setVerifStep(1); 
        const t1 = setTimeout(() => setVerifStep(2), 1500); 
        const t2 = setTimeout(() => setVerifStep(3), 3500); 
        const t3 = setTimeout(() => { 
            if (state.finalSolutionLatex) setVerifStep(4); 
        }, 5000);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
    else if (state && state.solutionState) {
        setVerifStep(4); 
    }
    else {
      setAnimating(false);
      setVerifStep(0);
    }
  }, [state]);

  let lhsTex = formatForLatex(displayState.lhs);
  let rhsTex = formatForLatex(displayState.rhs);
  const signTex = String(displayState.sign || "=");
  
  if (animating && state.lastOp) {
      const valTex = formatForLatex(state.lastOp.val);
      const opTex = `{\\color{#e74c3c} \\quad ${formatOp(state.lastOp.op)} \\; ${valTex}}`;
      lhsTex = `${lhsTex} ${opTex}`;
      rhsTex = `${rhsTex} ${opTex}`;
  }

  // --- HISTORIQUE ---
  // On récupère tout l'historique SAUF la dernière étape (qui est l'état courant affiché en gros)
  const historySteps = displayState.history || [];
  const previousSteps = historySteps.slice(0, historySteps.length - 1);
  const hasHistory = historySteps.length > 0;

  return (
    <div ref={containerRef} className="w-full h-full bg-white flex flex-col font-sans relative overflow-y-auto custom-scrollbar scroll-smooth">
      <div className="flex-1 flex flex-col items-center py-8 px-4 gap-6">
          
          {/* 1. SECTION HISTORIQUE (Les lignes "perdues") */}
          <div className="flex flex-col items-center gap-3 w-full opacity-60 hover:opacity-100 transition-opacity duration-300">
              {/* État Initial */}
              {hasHistory && (
                  <div className="flex items-center gap-4 text-xl text-slate-400 font-serif border-b border-slate-100 pb-1">
                      <span><InlineMath math={formatForLatex(displayState.initialLhs)} /></span>
                      <span className="text-sm text-slate-300"><InlineMath math={displayState.initialSign || "="} /></span>
                      <span><InlineMath math={formatForLatex(displayState.initialRhs)} /></span>
                  </div>
              )}

              {/* Étapes intermédiaires */}
              {previousSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-4 animate-in slide-in-from-top-2 relative">
                      <div className="flex items-center gap-3 text-xl text-slate-500 font-serif">
                          <span><InlineMath math={formatForLatex(step.lhs)} /></span>
                          <span className="text-slate-400"><InlineMath math={step.sign} /></span>
                          <span><InlineMath math={formatForLatex(step.rhs)} /></span>
                      </div>
                      {/* Annotation de l'opération effectuée */}
                      <div className="absolute -right-24 top-1/2 -translate-y-1/2 text-xs font-mono text-blue-400 bg-blue-50 px-2 py-1 rounded hidden md:block">
                          | {step.op === '*' ? '×' : (step.op === '/' ? '÷' : step.op)} {step.val}
                      </div>
                  </div>
              ))}
              
              {hasHistory && <div className="text-slate-300 my-1">↓</div>}
          </div>

          {/* 2. ÉQUATION PRINCIPALE (État Courant) */}
          <div className="w-full overflow-x-auto flex justify-center pb-2 z-10 sticky top-4">
            <div className={`flex items-center gap-3 text-2xl md:text-4xl whitespace-nowrap font-serif transition-all duration-500 ${animating ? 'scale-105' : 'scale-100'} text-slate-800`}>
                <div className="bg-slate-50 px-5 py-4 rounded-2xl border-b-4 border-blue-200 shadow-md min-w-[100px] text-center transition-colors duration-300 hover:bg-blue-50 hover:border-blue-300">
                   {lhsTex ? <InlineMath math={lhsTex} /> : <span className="text-slate-300">?</span>}
                </div>
                <div className="text-slate-400 font-bold mx-2"><InlineMath math={signTex} /></div>
                <div className="bg-slate-50 px-5 py-4 rounded-2xl border-b-4 border-red-200 shadow-md min-w-[100px] text-center transition-colors duration-300 hover:bg-red-50 hover:border-red-300">
                   {rhsTex ? <InlineMath math={rhsTex} /> : <span className="text-slate-300">?</span>}
                </div>
            </div>
          </div>

          {/* 3. ZONE VÉRIFICATION */}
          {verifStep > 0 && state.verification && (
              <div className="w-full max-w-lg bg-white rounded-xl border-2 border-blue-100 p-0 overflow-hidden shadow-lg animate-in slide-in-from-bottom-4 duration-500 mb-8">
                  <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex justify-between items-center">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                          <span>🔎</span> Vérification
                      </span>
                      <span className="text-sm font-mono bg-white px-2 py-1 rounded text-blue-800 border border-blue-200 shadow-sm">
                          Si <InlineMath math={`x = ${state.verification.testVal}`} />
                      </span>
                  </div>
                  
                  <div className="p-5 flex flex-col gap-4 text-sm">
                      {/* Étape 1 : Remplacement */}
                      <div className={`flex items-start gap-3 transition-opacity duration-500 ${verifStep >= 1 ? 'opacity-100' : 'opacity-0'}`}>
                          <div className="mt-1 w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">1</div>
                          <div className="font-serif text-lg text-slate-600">
                             <InlineMath math={`${formatForLatex(state.verification.originLhs)} ${state.verification.checkSign} ${formatForLatex(state.verification.originRhs)}`} />
                          </div>
                      </div>

                      {/* Étape 2 : Substitution */}
                      <div className={`flex items-start gap-3 transition-opacity duration-500 ${verifStep >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                          <div className="mt-1 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">2</div>
                          <div className="font-serif text-lg">
                             <InlineMath math={`${formatSubstitution(state.verification.originLhs, state.verification.testVal)} ${state.verification.checkSign} ${formatSubstitution(state.verification.originRhs, state.verification.testVal)}`} />
                          </div>
                      </div>

                      {/* Étape 3 : Calcul & Verdict */}
                      <div className={`flex items-start gap-3 transition-opacity duration-500 ${verifStep >= 3 ? 'opacity-100' : 'opacity-0'}`}>
                          <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${state.verification.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                              {state.verification.isCorrect ? '✓' : '✗'}
                          </div>
                          <div className="flex-1">
                              <div className={`flex items-center justify-between p-3 rounded-lg border ${state.verification.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                 <span className="font-bold font-serif text-lg text-slate-800">
                                    {state.verification.valLhs} <span className="mx-2 text-slate-400">{state.verification.checkSign}</span> {state.verification.valRhs}
                                 </span>
                                 <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide ${state.verification.isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                     {state.verification.isCorrect ? "VRAI" : "FAUX"}
                                 </span>
                              </div>
                              {state.verification.feedbackMsg && (
                                  <div className="mt-2 text-xs italic text-slate-500 pl-2 border-l-2 border-slate-300">
                                      {state.verification.feedbackMsg}
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* 4. SOLUTION FINALE */}
          {state.finalSolutionLatex && verifStep === 4 && (
              <div className="animate-in zoom-in duration-500 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-2xl shadow-xl shadow-emerald-200 mt-2 mb-8 transform hover:scale-105 transition-transform">
                  <div className="text-3xl font-bold text-center drop-shadow-md">
                      <InlineMath math={state.finalSolutionLatex} />
                  </div>
                  <div className="text-center text-emerald-100 text-xs font-bold uppercase mt-2 tracking-[0.2em]">Solution Trouvée</div>
              </div>
          )}
          
          {/* 5. GRAPHIQUE */}
          <EquationGraph 
             lhs={displayState.lhs} rhs={displayState.rhs} 
             initialLhs={displayState.initialLhs} initialRhs={displayState.initialRhs}
             isVisible={canShowGraph && !state.finalSolutionLatex} 
             isModified={isModified} sign={displayState.sign}
          />
      </div>
    </div>
  );
}