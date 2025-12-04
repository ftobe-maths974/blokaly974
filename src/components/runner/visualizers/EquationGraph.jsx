import React, { useEffect, useRef, useState, useDeferredValue } from 'react';
import functionPlot from 'function-plot';
import nerdamer from 'nerdamer';

export default function EquationGraph({ lhs, rhs, initialLhs, initialRhs, isVisible, isModified }) {
  const plotRefInitial = useRef(null);
  const plotRefCurrent = useRef(null);
  
  // État du slider (Valeur immédiate pour l'UI)
  const [xVal, setXVal] = useState(0);
  
  // Valeur différée (Pour le calcul lourd du graphique)
  // React attendra que l'utilisateur arrête de bouger pour recalculer le graphe
  const deferredX = useDeferredValue(xVal);

  // Helper de dessin
  const drawGraph = (ref, eqLhs, eqRhs, title, width, xValue) => {
    if (!ref.current) return;
    try {
        // 1. Nettoyage pour function-plot (x doit être x)
        const fn1 = eqLhs.replace(/x/g, 'x'); 
        const fn2 = eqRhs.replace(/x/g, 'x');
        
        // 2. Calcul des points (Y) pour le curseur
        const y1 = parseFloat(nerdamer(eqLhs, { x: xValue }).evaluate().text());
        const y2 = parseFloat(nerdamer(eqRhs, { x: xValue }).evaluate().text());

        functionPlot({
            target: ref.current,
            width: width, 
            height: 220,
            yAxis: { domain: [-10, 20] }, 
            xAxis: { domain: [-10, 10] },
            grid: true,
            title: title,
            data: [ 
                { fn: fn1, color: '#3b82f6', attr: { "stroke-width": 3 } }, // Bleu
                { fn: fn2, color: '#ef4444', attr: { "stroke-width": 3 } }, // Rouge
                // Points mobiles
                { 
                    points: [[xValue, y1]], fnType: 'points', graphType: 'scatter', color: '#3b82f6',
                    attr: { r: 5, "stroke-width": 2, fill: "white" } 
                },
                { 
                    points: [[xValue, y2]], fnType: 'points', graphType: 'scatter', color: '#ef4444',
                    attr: { r: 5, "stroke-width": 2, fill: "white" } 
                }
            ]
        });
    } catch (e) {
        console.warn("Erreur de tracé:", e);
    }
  };

  // Effet de dessin (déclenché par la valeur différée pour la perf)
  useEffect(() => {
    if (!isVisible) return;

    if (isModified) {
        drawGraph(plotRefInitial, initialLhs || "x", initialRhs || "0", "Départ", 280, deferredX);
        drawGraph(plotRefCurrent, lhs, rhs, "État Actuel", 280, deferredX);
    } else {
        drawGraph(plotRefCurrent, lhs, rhs, "Analyse Graphique", 500, deferredX);
    }
  }, [isVisible, lhs, rhs, initialLhs, initialRhs, isModified, deferredX]);

  if (!isVisible) return null;

  return (
    <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-200 animate-in slide-in-from-top-4 fade-in duration-300">
        
        {/* CONTENEUR DES GRAPHES */}
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
        
        {/* SLIDER (Utilise la valeur immédiate pour être réactif) */}
        <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm max-w-md mx-auto">
            <span className="text-xs font-bold text-slate-500 uppercase">Valeur x</span>
            <input 
                type="range" min="-10" max="10" step="0.5" 
                value={xVal} 
                onChange={(e) => setXVal(parseFloat(e.target.value))} 
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
            />
            <span className="w-8 text-right font-mono font-bold text-indigo-600">{xVal}</span>
        </div>
    </div>
  );
}