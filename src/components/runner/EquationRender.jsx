import React, { useEffect, useState, useRef } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import functionPlot from 'function-plot';
import nerdamer from 'nerdamer';

export default function EquationRender({ state }) {
  const safeState = state || { lhs: "x", rhs: "0", sign: "=", initialLhs: "x", initialRhs: "0", history: [] };
  const [displayState, setDisplayState] = useState(safeState);
  const [animating, setAnimating] = useState(false);
  
  // Séquençage : 0=Rien, 1=Rappel, 2=Subst, 3=Calcul, 4=Conclusion
  const [verifStep, setVerifStep] = useState(0);
  
  // Graphique
  const [showGraph, setShowGraph] = useState(false);
  const [graphX, setGraphX] = useState(0);
  
  const plotRefCurrent = useRef(null);
  const plotRefInitial = useRef(null);

  const isImplicit = state?.implicit === true;
  const canShowGraph = state?.showGraph === true;
  const isModified = (displayState.history || []).length > 0;

  // --- 1. FORMATAGE STANDARD ---
  const formatForLatex = (expression) => {
    if (!expression) return "";
    let tex = String(expression);
    if (isImplicit) {
        tex = tex.replace(/(\d)\s*\*\s*([a-zA-Z])/g, '$1$2'); // 2*x -> 2x
        tex = tex.replace(/\b1([a-zA-Z])/g, '$1'); // 1x -> x
        tex = tex.replace(/\*/g, '\\times '); // Autres * -> x
    } else {
        tex = tex.replace(/\*/g, '\\times ');
    }
    return tex;
  };

  const formatOp = (op) => {
    if (op === '*') return '\\times';
    if (op === '/') return '\\div';
    return op;
  };

  // --- 2. FORMATAGE SUBSTITUTION (RIGOUREUX) ---
  const formatSubstitution = (expr, val) => {
      if (!expr) return "";
      let str = String(expr);
      
      // ÉTAPE CRUCIALE : On réintroduit explicitement la multiplication pour éviter le "30"
      // Si on a un chiffre suivi de x (ex: "3x" ou "3*x"), on force "3 * x"
      // Nerdamer stocke souvent "3*x", donc on remplace simplement * par \times
      
      // 1. On remplace le symbole de multiplication par le visuel LaTeX
      let tex = str.replace(/\*/g, ' \\times ');
      
      // 2. Cas rare où Nerdamer aurait renvoyé "3x" (implicite) : on force le times
      tex = tex.replace(/(\d)\s*x/g, '$1 \\times x');

      // 3. On remplace x par la valeur colorée
      // On utilise des parenthèses si la valeur est négative pour la propreté : 3 * (-2)
      const displayVal = val < 0 ? `(${val})` : val;
      const replacement = `{\\color{#3498db}\\mathbf{${displayVal}}}`;
      
      return tex.replace(/x/g, replacement);
  };

  // --- ORCHESTRATION ---
  useEffect(() => {
    // A. Animation Calcul (Rouge)
    if (state && state.lastOp && !state.lastOp.error) {
      setAnimating(true);
      setVerifStep(0); // On reset la vérif pour ne pas polluer
      const timer = setTimeout(() => {
        setAnimating(false);
        setDisplayState(state);
      }, 2000); 
      return () => { clearTimeout(timer); setAnimating(false); setDisplayState(state); };
    } 
    
    // B. Animation VÉRIFICATION (La séquence complète)
    else if (state && state.verification) {
        setAnimating(false);
        setDisplayState(state);
        
        // On force le graphique sur la valeur de vérification
        if (showGraph) setGraphX(state.verification.testVal);

        // Chronologie
        setVerifStep(1); // T=0 : Rappel équation départ
        
        const t1 = setTimeout(() => setVerifStep(2), 1500); // T+1.5s : Injection (3 * 0)
        const t2 = setTimeout(() => setVerifStep(3), 3500); // T+3.5s : Calculs faits + Verdict
        const t3 = setTimeout(() => {
             // Si c'est la bonne réponse, on affiche la solution finale S={...}
             if (state.finalSolutionLatex) setVerifStep(4);
        }, 5000); // T+5.0s

        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }

    // C. CONCLUSION DIRECTE (Pas de solution / Infinité)
    else if (state && state.solutionState) {
        setDisplayState(state);
        setVerifStep(4); // On va direct à la fin
    }

    // D. RESET / TIME TRAVEL
    else if (state) {
      setAnimating(false);
      setDisplayState(state);
      setVerifStep(0);
    }
  }, [state]);

  // --- GRAPH ---
  const drawGraph = (ref, lhs, rhs, title, width = 300) => {
    if (!ref.current) return;
    try {
        const fn1 = lhs.replace(/x/g, 'x'); 
        const fn2 = rhs.replace(/x/g, 'x');
        // Calcul synchrone pour fluidité
        const y1 = parseFloat(nerdamer(lhs, { x: graphX }).evaluate().text());
        const y2 = parseFloat(nerdamer(rhs, { x: graphX }).evaluate().text());

        functionPlot({
            target: ref.current,
            width: width, height: 220,
            yAxis: { domain: [-10, 20] }, xAxis: { domain: [-10, 10] },
            grid: true,
            title: title,
            data: [ 
                { fn: fn1, color: '#3b82f6', attr: { "stroke-width": 3 } }, 
                { fn: fn2, color: '#ef4444', attr: { "stroke-width": 3 } },
                { points: [[graphX, y1]], fnType: 'points', graphType: 'scatter', color: '#3b82f6', attr: { r: 5, "stroke-width": 2, fill: "white" } },
                { points: [[graphX, y2]], fnType: 'points', graphType: 'scatter', color: '#ef4444', attr: { r: 5, "stroke-width": 2, fill: "white" } }
            ]
        });
    } catch (e) {}
  };

  useEffect(() => {
    if (!showGraph) return;
    if (isModified) {
        drawGraph(plotRefInitial, displayState.initialLhs || "x", displayState.initialRhs || "0", "Départ", 280);
        drawGraph(plotRefCurrent, displayState.lhs, displayState.rhs, "Actuel", 280);
    } else {
        drawGraph(plotRefCurrent, displayState.lhs, displayState.rhs, "Analyse", 500);
    }
  }, [displayState, showGraph, graphX, isModified]);


  // --- RENDER PRINCIPAL ---
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
          
          {/* ÉQUATION ACTUELLE (Haut de page) */}
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

          {/* ZONE DE TRACE ÉCRITE (DÉROULEMENT) */}
          {verifStep > 0 && state.verification && (
              <div className="w-full max-w-lg bg-white rounded-xl border-2 border-blue-100 p-0 overflow-hidden shadow-sm animate-in slide-in-from-top-4 duration-500">
                  <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex justify-between items-center">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Vérification</span>
                      <span className="text-xs font-mono bg-white px-2 py-1 rounded text-blue-800 border border-blue-200">x = {state.verification.testVal}</span>
                  </div>
                  
                  <div className="p-4 flex flex-col gap-4 text-sm">
                      {/* 1. Rappel Énoncé */}
                      <div className={`flex items-center gap-3 transition-opacity duration-500 ${verifStep >= 1 ? 'opacity-100' : 'opacity-0'}`}>
                          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">1</div>
                          <div className="font-mono text-slate-500">
                             <InlineMath math={`${formatForLatex(state.verification.originLhs)} = ${formatForLatex(state.verification.originRhs)}`} />
                          </div>
                      </div>

                      {/* 2. Substitution (Avec multiplication explicite !) */}
                      <div className={`flex items-center gap-3 transition-opacity duration-500 ${verifStep >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">2</div>
                          <div className="font-mono">
                             <InlineMath math={`${formatSubstitution(state.verification.originLhs, state.verification.testVal)} = ${formatSubstitution(state.verification.originRhs, state.verification.testVal)}`} />
                          </div>
                      </div>

                      {/* 3. Calcul & Conclusion Binaire */}
                      <div className={`flex items-center gap-3 transition-opacity duration-500 ${verifStep >= 3 ? 'opacity-100' : 'opacity-0'}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${state.verification.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>3</div>
                          <div className="flex-1 flex items-center justify-between bg-slate-50 p-2 rounded">
                             <span className="font-bold font-mono text-slate-700">
                                {state.verification.valLhs} {state.verification.isCorrect ? '=' : '≠'} {state.verification.valRhs}
                             </span>
                             <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${state.verification.isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                 {state.verification.isCorrect ? "VRAI" : "FAUX"}
                             </span>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* SOLUTION FINALE S={...} */}
          {state.finalSolutionLatex && verifStep === 4 && (
              <div className="animate-in zoom-in duration-500 bg-emerald-50 text-emerald-900 px-6 py-3 rounded-xl border border-emerald-200 shadow-md mt-2">
                  <div className="text-2xl font-bold text-center">
                      <InlineMath math={state.finalSolutionLatex} />
                  </div>
              </div>
          )}

          {/* FEEDBACK CONCLUSION (Si erreur) */}
          {state.solutionState && !state.solutionState.isSuccess && (
              <div className="w-full p-4 rounded-xl border text-center bg-red-50 border-red-200 text-red-700 animate-bounce">
                 <span className="font-bold">🤔 Humm...</span>
                 <p className="text-xs mt-1">{state.solutionState.msg}</p>
              </div>
          )}

          {/* MESSAGE D'ATTENTE (Si rien ne se passe) */}
          {!state.finalSolutionLatex && verifStep === 0 && !state.solutionState && (
            <div className="h-6 text-xs font-medium text-center">
                {state.lastOp?.error ? (
                    <span className="text-red-500 flex items-center justify-center gap-2 animate-bounce">⚠️ {state.lastOp.error}</span>
                ) : (
                    <span className="text-slate-400 italic">{animating ? "Calcul en cours..." : "En attente d'instructions"}</span>
                )}
            </div>
          )}

          {/* BOUTON GRAPHIQUE */}
          {canShowGraph && !state.finalSolutionLatex && (
              <button onClick={() => setShowGraph(!showGraph)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${showGraph ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  <span>{showGraph ? '🔽' : '📈'}</span> Explorer graphiquement
              </button>
          )}

          {/* ZONE GRAPHIQUE */}
          {showGraph && !state.finalSolutionLatex && (
              <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-200 animate-in slide-in-from-top-4 fade-in duration-300">
                  <div className="flex flex-wrap justify-center gap-4 mb-4">
                      {isModified ? (
                        <>
                          <div className="overflow-hidden rounded-lg bg-white border border-slate-200 shadow-sm opacity-70 grayscale-[50%]">
                              <div ref={plotRefInitial}></div>
                          </div>
                          <div className="overflow-hidden rounded-lg bg-white border-2 border-blue-100 shadow-md">
                              <div ref={plotRefCurrent}></div>
                          </div>
                        </>
                      ) : (
                         <div className="overflow-hidden rounded-lg bg-white border-2 border-blue-100 shadow-md">
                            <div ref={plotRefCurrent}></div>
                         </div>
                      )}
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm max-w-md mx-auto">
                      <span className="text-xs font-bold text-slate-500 uppercase">Valeur x</span>
                      <input type="range" min="-10" max="10" step="0.5" value={graphX} onChange={(e) => setGraphX(parseFloat(e.target.value))} className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                      <span className="w-8 text-right font-mono font-bold text-indigo-600">{graphX}</span>
                  </div>
              </div>
          )}
      </div>

      {/* HISTORIQUE EN BAS */}
      {safeState.history && safeState.history.length > 0 && (
          <div className="bg-slate-50 border-t border-slate-200 p-3">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Historique</h5>
              <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-1">
                  {safeState.history.map((step, i) => (
                      <div key={i} className="flex-shrink-0 bg-white px-2 py-1.5 rounded border border-slate-200 text-[10px] text-slate-600 flex flex-col items-center min-w-[60px] shadow-sm">
                          <span className="font-mono font-bold text-blue-600">{formatOp(step.op)} {step.val}</span>
                          <div className="w-full h-px bg-slate-100 my-1"></div>
                          <span className="text-slate-400">#{i + 1}</span>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
}