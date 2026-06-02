import React from 'react';

const PALETTE = { R: '#e74c3c', B: '#3498db', J: '#f1c40f', V: '#2ecc71' };

function Strip({ cells, label, robotPos }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <div className="flex gap-[3px] bg-slate-300 p-[3px] rounded-lg">
        {cells.map((c, i) => (
          <div key={i} className="relative" style={{ width: 30, height: 30 }}>
            <div
              className="w-full h-full rounded"
              style={{ background: c ? PALETTE[c] : '#fff', border: '1px solid rgba(0,0,0,0.12)' }}
            />
            {robotPos === i && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-base">🤖</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MotifRunner({ levelData, state }) {
  const target = levelData.target || [];
  const cells = state?.cells || new Array(target.length).fill(null);
  const pos = state?.pos ?? 0;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-8 bg-slate-50 p-6 overflow-auto">
      <Strip cells={target} label="🎯 Motif à reproduire" />
      <div className="text-2xl text-slate-300">⬇️</div>
      <Strip cells={cells} label="🎨 Ton dessin" robotPos={pos < cells.length ? pos : -1} />
    </div>
  );
}
