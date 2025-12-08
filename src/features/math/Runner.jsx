import React from 'react';

export default function MathRunner({ state, history, hiddenVars }) {
  const variables = state?.variables || {};
  const logs = history || [];
  const hiddenList = hiddenVars || [];

  const visibleVariables = Object.entries(variables).filter(([name]) => !hiddenList.includes(name));

  const ValueRenderer = ({ value }) => {
    if (Array.isArray(value)) {
      return (
        <div className="flex gap-1 mt-2 flex-wrap justify-center">
          {value.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center animate-in zoom-in duration-200">
               <div className="bg-white border-2 border-slate-700 px-2 py-1 min-w-[30px] text-center font-bold text-lg shadow-sm text-slate-800">
                 {item}
               </div>
               <span className="text-[10px] text-slate-400 font-mono mt-1">{idx}</span>
            </div>
          ))}
          {value.length === 0 && <span className="text-slate-400 italic text-sm">Vide []</span>}
        </div>
      );
    }
    return <div className="text-4xl font-extrabold text-slate-700 tracking-tight my-2">{value}</div>;
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-100 p-4 gap-4 box-border overflow-hidden">
      
      {/* ZONE MÉMOIRE (VARIABLES) */}
      <div className="flex-1 flex flex-wrap content-start justify-center gap-4 overflow-y-auto p-2">
        {visibleVariables.map(([name, value]) => (
           <div key={name} className="bg-white rounded-xl shadow-md border border-slate-200 p-4 min-w-[140px] flex flex-col items-center transition-all hover:shadow-lg hover:-translate-y-1">
             <div className="w-full text-center border-b-2 border-slate-100 pb-2 mb-2">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-sm">{name}</span>
             </div>
             
             <ValueRenderer value={value} />

             <div className="mt-2 px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-400 uppercase">
               {Array.isArray(value) ? `Liste (${value.length})` : typeof value}
             </div>
           </div>
        ))}
        
        {visibleVariables.length === 0 && (
           <div className="flex flex-col items-center justify-center h-full text-slate-400 italic gap-2 opacity-60">
             <span className="text-4xl">👻</span>
             <span>Mémoire vide ou masquée</span>
           </div>
        )}
      </div>

      {/* CONSOLE / TERMINAL */}
      <div className="h-1/3 bg-slate-900 rounded-lg overflow-hidden flex flex-col shadow-inner border border-slate-700">
        <div className="bg-slate-800 px-4 py-2 flex items-center gap-2 border-b border-slate-700">
          <div className="flex gap-1.5">
             <div className="w-3 h-3 rounded-full bg-red-500"></div>
             <div className="w-3 h-3 rounded-full bg-amber-500"></div>
             <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          </div>
          <span className="text-xs font-mono text-slate-400 ml-2">Terminal</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1 custom-scrollbar">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-3 animate-in slide-in-from-left-2 duration-200">
              <span className="text-slate-600 select-none w-6 text-right">{i+1}</span>
              <span className="text-emerald-400">{log}</span>
            </div>
          ))}
          <div className="text-emerald-500 animate-pulse">_</div>
        </div>
      </div>
    </div>
  );
}