import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import remarkGfm from 'remark-gfm';

export default function InstructionPanel({ title, content, isCollapsed, onToggle }) {
  return (
    <div 
      className={`
        relative flex flex-col flex-shrink-0 bg-white border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.05)]
        transition-all duration-300 ease-in-out 
        z-50  /* <--- Augmentation drastique du z-index pour passer au-dessus de Blockly */
        ${isCollapsed ? 'w-12' : 'w-96'}
      `}
    >
      {/* BOUTON TOGGLE */}
      <button 
        onClick={onToggle}
        className="absolute -right-3 top-6 z-50 w-6 h-6 flex items-center justify-center 
                   bg-white border border-slate-200 rounded-full shadow-md text-slate-500 
                   hover:text-blue-600 hover:scale-110 transition-all cursor-pointer"
        title={isCollapsed ? "Ouvrir" : "Fermer"}
      >
        {/* On remplace la flèche texte par un SVG pour être sûr qu'il soit centré */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3 h-3 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      {!isCollapsed && (
        <div className="flex flex-col h-full overflow-hidden">
          {/* EN-TÊTE */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 backdrop-blur-sm">
            <h2 className="m-0 text-xl font-bold text-slate-800 flex items-center gap-2">
               <span className="text-2xl">📘</span> {title || "Mission"}
            </h2>
          </div>
          
          {/* CONTENU SCROLLABLE */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="prose prose-slate prose-p:text-slate-600 prose-headings:text-slate-800 prose-strong:text-indigo-600 prose-code:text-pink-500 prose-code:bg-pink-50 prose-code:px-1 prose-code:rounded prose-table:border-collapse prose-th:border prose-th:border-slate-200 prose-th:p-2 prose-td:border prose-td:border-slate-200 prose-td:p-2 text-sm leading-relaxed">              {content ? (
                  <ReactMarkdown 
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {content}
                  </ReactMarkdown>
              ) : (
                  <p className="text-slate-400 italic text-center mt-10">Aucune consigne pour ce niveau.</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* MODE PLIÉ (Vertical) */}
      {isCollapsed && (
        <div 
            onClick={onToggle}
            className="h-full flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
        >
            <div className="writing-vertical-rl rotate-180 font-bold text-slate-400 tracking-widest text-xs uppercase flex items-center gap-2">
                <span>CONSIGNE</span>
                <span className="text-lg">📘</span>
            </div>
        </div>
      )}
      
      {/* Petite classe utilitaire pour l'écriture verticale si nécessaire, 
          sinon Tailwind a 'vertical-rl' via plugin ou on garde le style inline juste pour ça si ça bug */}
      <style>{`
        .writing-vertical-rl { writing-mode: vertical-rl; }
        /* Scrollbar fine pour Chrome/Safari/Edge */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
      `}</style>
    </div>
  );
}