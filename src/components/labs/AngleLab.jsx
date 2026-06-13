import React, { useState, useRef, useEffect, useCallback } from 'react';

// ============================================================
// Atelier des angles — comprendre pourquoi « tourner de 120° »
// dessine un angle de 60° (le virage = SUPPLÉMENT de l'angle voulu).
// 3 modes : Supplément · Tour complet · Quiz.
// ============================================================

// Angles en degrés, sens horaire depuis l'Est (repère écran, y vers le bas)
const pol = (cx, cy, r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};
const sector = (cx, cy, r, a0, a1) => {
  const [x0, y0] = pol(cx, cy, r, a0);
  const [x1, y1] = pol(cx, cy, r, a1);
  const delta = a1 - a0;
  const large = Math.abs(delta) > 180 ? 1 : 0;
  const sweep = delta >= 0 ? 1 : 0; // sens horaire si l'angle augmente, anti-horaire sinon
  return `M ${cx} ${cy} L ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${large} ${sweep} ${x1.toFixed(1)} ${y1.toFixed(1)} Z`;
};

function useTween() {
  const raf = useRef(null);
  const stop = useCallback(() => { if (raf.current) cancelAnimationFrame(raf.current); }, []);
  const run = useCallback((from, to, ms, onUpdate, onDone) => {
    stop();
    const t0 = performance.now();
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      const eased = 1 - Math.pow(1 - k, 3);
      onUpdate(from + (to - from) * eased);
      if (k < 1) raf.current = requestAnimationFrame(tick);
      else if (onDone) onDone();
    };
    raf.current = requestAnimationFrame(tick);
  }, [stop]);
  useEffect(() => stop, [stop]);
  return { run, stop };
}

// Flèche orientée (pointe vers l'Est par défaut), pivot autour de (cx,cy)
const TurtleArrow = ({ cx, cy, angle, color = '#16a34a' }) => (
  <g transform={`rotate(${angle} ${cx} ${cy})`}>
    <path d={`M ${cx - 9} ${cy - 8} L ${cx + 13} ${cy} L ${cx - 9} ${cy + 8} L ${cx - 4} ${cy} Z`}
      fill={color} stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
  </g>
);

// Slider de vitesse 🐢—🐇 (comme le runner). 0 = lent, 100 = rapide.
const SpeedSlider = ({ value, onChange }) => (
  <div className="flex items-center gap-2 text-lg">
    <span title="Lent">🐢</span>
    <input type="range" min="0" max="100" value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="flex-1 accent-indigo-500" />
    <span title="Rapide">🐇</span>
  </div>
);
// vitesse → durée d'animation (ms). 🐢 (0) ≈ 3,6× lent ; 🐇 (100) ≈ 0,3× rapide.
const durFor = (speed, base) => Math.max(120, Math.round(base * (3.6 - speed * 0.033)));

// ------------------------------------------------------------
// MODE 1 — LE SUPPLÉMENT
// ------------------------------------------------------------
export function SupplementMode() {
  const V = { x: 175, y: 215 };
  const L = 135;
  const [turn, setTurn] = useState(120);
  const [anim, setAnim] = useState(120);
  const [speed, setSpeed] = useState(50);
  const [showGuide, setShowGuide] = useState(true);
  const [showInterior, setShowInterior] = useState(true);
  const { run } = useTween();

  const setBoth = (v) => { setTurn(v); setAnim(v); };
  const play = () => run(0, turn, durFor(speed, 1100), setAnim);

  const interior = 180 - anim;
  const [poutX, poutY] = pol(V.x, V.y, L, anim);
  const [lblTurnX, lblTurnY] = pol(V.x, V.y, 56, Math.max(8, anim) / 2);
  const [lblIntX, lblIntY] = pol(V.x, V.y, 92, (anim + 180) / 2);

  return (
    <div className="grid md:grid-cols-[1fr,260px] gap-6 items-center">
      <svg viewBox="0 0 360 360" className="w-full bg-slate-50 rounded-xl border border-slate-200">
        {showInterior && anim < 179 && <path d={sector(V.x, V.y, 86, anim, 180)} fill="#3b82f6" opacity="0.18" />}
        {anim > 1 && <path d={sector(V.x, V.y, 50, 0, anim)} fill="#f97316" opacity="0.25" />}
        <line x1={V.x - L} y1={V.y} x2={V.x} y2={V.y} stroke="#334155" strokeWidth="5" strokeLinecap="round" />
        {showGuide && <line x1={V.x} y1={V.y} x2={V.x + L} y2={V.y} stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="7 7" />}
        <line x1={V.x} y1={V.y} x2={poutX} y2={poutY} stroke="#16a34a" strokeWidth="5" strokeLinecap="round" />
        <TurtleArrow cx={V.x} cy={V.y} angle={anim} />
        {anim > 12 && <text x={lblTurnX} y={lblTurnY} fontSize="15" fontWeight="bold" fill="#ea580c" textAnchor="middle">{Math.round(anim)}°</text>}
        {showInterior && anim < 168 && <text x={lblIntX} y={lblIntY} fontSize="15" fontWeight="bold" fill="#2563eb" textAnchor="middle">{Math.round(interior)}°</text>}
      </svg>

      <div className="flex flex-col gap-4">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
          <div className="font-bold text-orange-700">🟧 On tourne de {Math.round(turn)}°</div>
          <div className="font-bold text-blue-700 mt-1">🟦 Angle dessiné : {Math.round(180 - turn)}°</div>
          <div className="text-slate-500 text-xs mt-2 font-mono">{Math.round(turn)}° + {Math.round(180 - turn)}° = 180°</div>
        </div>
        <label className="text-sm font-semibold text-slate-600">
          Tourner de : <span className="text-orange-600 font-bold">{turn}°</span>
          <input type="range" min="0" max="180" step="5" value={turn}
            onChange={(e) => setBoth(parseInt(e.target.value))} className="w-full accent-orange-500 mt-1" />
        </label>
        <button onClick={play} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 rounded-lg shadow">▶️ Animer la rotation</button>
        <SpeedSlider value={speed} onChange={setSpeed} />
        <div className="flex gap-2 text-xs">
          <button onClick={() => setShowGuide((s) => !s)} className={`flex-1 py-1.5 rounded border ${showGuide ? 'bg-slate-700 text-white' : 'bg-white text-slate-500'}`}>┄ Tout droit</button>
          <button onClick={() => setShowInterior((s) => !s)} className={`flex-1 py-1.5 rounded border ${showInterior ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'}`}>🟦 Angle</button>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          La tortue continue tout droit (┄). Le <b className="text-orange-600">virage</b> se mesure depuis cette ligne.
          L'<b className="text-blue-600">angle de la figure</b> complète jusqu'au demi-tour (180°).
        </p>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// MODE 2 — LE TOUR COMPLET (tortue qui trace + pivote)
// ------------------------------------------------------------
export function TourCompletMode() {
  const [n, setN] = useState(5);
  const [pos, setPos] = useState(null);
  const [heading, setHeading] = useState(0);
  const [done, setDone] = useState([]);     // sommets atteints (trail)
  const [arc, setArc] = useState(null);     // { x, y, base, turn } au sommet courant
  const [cumul, setCumul] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(50);
  const { run, stop } = useTween();
  const runIdRef = useRef(0);

  const ext = Math.round((360 / n) * 100) / 100;
  const interiorVal = Math.round((180 - 360 / n) * 100) / 100;

  const C = { x: 180, y: 190 }, R = 120;
  const verts = Array.from({ length: n }, (_, i) => {
    const [x, y] = pol(C.x, C.y, R, -90 + (i * 360) / n);
    return { x, y };
  });
  const headingOf = (a, b) => (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;

  const tweenP = (from, to, ms, onU) => new Promise((res) => run(from, to, ms, onU, res));
  const reset = () => { stop(); setRunning(false); setPos(null); setDone([]); setArc(null); setCumul(0); };
  useEffect(() => stop, [stop]);

  const changeN = (val) => { runIdRef.current++; reset(); setN(val); };

  const play = async () => {
    const id = ++runIdRef.current;
    stop();
    setRunning(true); setArc(null); setCumul(0);
    let head = headingOf(verts[0], verts[1]);
    setHeading(head);
    setPos({ ...verts[0] });
    setDone([{ ...verts[0] }]);

    for (let i = 0; i < n; i++) {
      if (id !== runIdRef.current) return;
      const a = verts[i], b = verts[(i + 1) % n];
      // 1) avance le long de l'arête (trace)
      await tweenP(0, 1, durFor(speed, 650), (k) => {
        setPos({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
      });
      if (id !== runIdRef.current) return;
      setDone((d) => [...d, { ...b }]);
      // 2) pivote au sommet en montrant les deux angles + l'axe
      const base = head;                 // direction d'arrivée (= axe « tout droit »)
      setArc({ x: b.x, y: b.y, base, turn: 0 });
      await tweenP(0, ext, durFor(speed, 650), (t) => {
        setArc({ x: b.x, y: b.y, base, turn: t });
        setHeading(base + t);
      });
      if (id !== runIdRef.current) return;
      head = base + ext;
      setHeading(head);
      setCumul((c) => Math.round((c + ext) * 100) / 100);
      await new Promise((r) => setTimeout(r, durFor(speed, 250)));
      setArc(null);
    }
    if (id === runIdRef.current) setRunning(false);
  };

  // Tracé = tous les sommets atteints + la position vivante de la tortue, SAUF
  // si elle est déjà pile sur le dernier sommet (pivot) → on évite le doublon.
  // (Avant, `done.slice(0,-1)` jetait le dernier sommet → pendant le déplacement
  //  le trait reliait l'avant-dernier sommet à la tortue = glitch « point d'avant ».)
  const lastDone = done[done.length - 1];
  const atVertex = pos && lastDone && Math.abs(pos.x - lastDone.x) < 0.01 && Math.abs(pos.y - lastDone.y) < 0.01;
  const trail = pos
    ? (atVertex ? done.map((p) => [p.x, p.y]) : [...done.map((p) => [p.x, p.y]), [pos.x, pos.y]])
    : [];

  return (
    <div className="grid md:grid-cols-[1fr,260px] gap-6 items-center">
      <svg viewBox="0 0 360 360" className="w-full bg-slate-50 rounded-xl border border-slate-200">
        <polygon points={verts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#e2e8f0" strokeWidth="2" />
        {trail.length > 1 && <polyline points={trail.map((p) => p.join(',')).join(' ')} fill="none" stroke="#16a34a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />}

        {/* angles au sommet courant */}
        {arc && (() => {
          const [gx, gy] = pol(arc.x, arc.y, 70, arc.base);
          const [ltX, ltY] = pol(arc.x, arc.y, 40, arc.base + arc.turn / 2);
          const [liX, liY] = pol(arc.x, arc.y, 64, arc.base + arc.turn + (180 - arc.turn) / 2);
          return (
            <g>
              <line x1={arc.x} y1={arc.y} x2={gx} y2={gy} stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 6" />
              {arc.turn > 1 && <path d={sector(arc.x, arc.y, 34, arc.base, arc.base + arc.turn)} fill="#f97316" opacity="0.3" />}
              {arc.turn < 179 && <path d={sector(arc.x, arc.y, 58, arc.base + arc.turn, arc.base + 180)} fill="#3b82f6" opacity="0.18" />}
              {arc.turn > 6 && <text x={ltX} y={ltY} fontSize="12" fontWeight="bold" fill="#ea580c" textAnchor="middle">{Math.round(arc.turn)}°</text>}
              {arc.turn < 174 && <text x={liX} y={liY} fontSize="12" fontWeight="bold" fill="#2563eb" textAnchor="middle">{Math.round(180 - arc.turn)}°</text>}
            </g>
          );
        })()}

        {verts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill="#cbd5e1" />)}
        {pos && <TurtleArrow cx={pos.x} cy={pos.y} angle={heading} />}

        <text x={C.x} y={C.y - 4} fontSize="12" fill="#64748b" textAnchor="middle">virages cumulés</text>
        <text x={C.x} y={C.y + 22} fontSize="24" fontWeight="bold" fill={cumul >= 360 ? '#16a34a' : '#ea580c'} textAnchor="middle">{Math.round(cumul)}°</text>
        <text x={C.x} y={C.y + 40} fontSize="11" fill="#94a3b8" textAnchor="middle">/ 360°</text>
      </svg>

      <div className="flex flex-col gap-4">
        <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 text-sm">
          <div className="font-bold text-slate-700">Polygone à {n} côtés</div>
          <div className="text-orange-600 font-bold mt-1">🟧 Virage : 360 ÷ {n} = {ext}°</div>
          <div className="text-blue-600 font-bold">🟦 Angle figure : {interiorVal}°</div>
        </div>
        <label className="text-sm font-semibold text-slate-600">
          Nombre de côtés : <span className="font-bold">{n}</span>
          <input type="range" min="3" max="10" step="1" value={n} onChange={(e) => changeN(parseInt(e.target.value))} className="w-full accent-indigo-500 mt-1" />
        </label>
        <button onClick={play} disabled={running} className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold py-2 rounded-lg shadow">▶️ Faire le tour</button>
        <SpeedSlider value={speed} onChange={setSpeed} />
        <p className="text-xs text-slate-500 leading-relaxed">
          À chaque sommet, la tortue pivote du <b className="text-orange-600">virage</b> 🟧 ; l'<b className="text-blue-600">angle de la figure</b> 🟦 est son supplément.
          Sur un tour complet, les virages totalisent <b>360°</b> → chaque virage = <b>360 ÷ {n}</b>.
        </p>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// MODE 3 — QUIZ (figure manipulable + input)
// ------------------------------------------------------------
const QUIZ = [
  { name: 'triangle équilatéral', interior: 60 },
  { name: 'carré', interior: 90 },
  { name: 'pentagone régulier', interior: 108 },
  { name: 'hexagone régulier', interior: 120 },
  { name: 'octogone régulier', interior: 135 },
];

const randDir = () => (Math.random() < 0.5 ? 'L' : 'R');

export function QuizMode() {
  const V = { x: 175, y: 215 }, L = 135;
  const [qi, setQi] = useState(0);
  const [deg, setDeg] = useState('');          // saisie dans la brique (texte)
  const [dir, setDir] = useState(randDir());   // sens tiré au hasard
  const [result, setResult] = useState(null);
  const [score, setScore] = useState({ ok: 0, total: 0 });

  const q = QUIZ[qi];
  const answer = 180 - q.interior;
  const a = Math.max(0, Math.min(180, parseInt(deg) || 0)); // amplitude du virage saisi
  const interior = 180 - a;
  const out = dir === 'R' ? a : -a;            // sens horaire (droite) ou anti-horaire (gauche)
  const back = dir === 'R' ? 180 : -180;

  const check = () => {
    const ok = parseInt(deg) === answer;
    setResult(ok ? 'ok' : 'ko');
    setScore((s) => ({ ok: s.ok + (ok ? 1 : 0), total: s.total + 1 }));
  };
  const next = () => { setQi((i) => (i + 1) % QUIZ.length); setDir(randDir()); setDeg(''); setResult(null); };

  const [poutX, poutY] = pol(V.x, V.y, L, out);
  const [ltX, ltY] = pol(V.x, V.y, 38, out / 2);
  const [liX, liY] = pol(V.x, V.y, 92, (out + back) / 2);

  return (
    <div className="grid md:grid-cols-[1fr,280px] gap-6 items-center">
      <svg viewBox="0 0 360 360" className="w-full bg-slate-50 rounded-xl border border-slate-200">
        {a > 1 && <path d={sector(V.x, V.y, 86, out, back)} fill="#3b82f6" opacity="0.15" />}
        {a > 1 && <path d={sector(V.x, V.y, 50, 0, out)} fill="#f97316" opacity="0.22" />}
        <line x1={V.x - L} y1={V.y} x2={V.x} y2={V.y} stroke="#334155" strokeWidth="5" strokeLinecap="round" />
        <line x1={V.x} y1={V.y} x2={V.x + L} y2={V.y} stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="7 7" />
        <line x1={V.x} y1={V.y} x2={poutX} y2={poutY} stroke="#16a34a" strokeWidth="5" strokeLinecap="round" />
        <TurtleArrow cx={V.x} cy={V.y} angle={out} />
        {a > 12 && <text x={ltX} y={ltY} fontSize="14" fontWeight="bold" fill="#ea580c" textAnchor="middle">{a}°</text>}
        {a > 0 && a < 168 && <text x={liX} y={liY} fontSize="14" fontWeight="bold" fill="#2563eb" textAnchor="middle">{interior}°</text>}
      </svg>

      <div className="flex flex-col gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
          <div className="text-slate-500 text-xs uppercase font-bold">Défi</div>
          <div className="text-slate-800 mt-1">Pour un <b>{q.name}</b>, il faut un angle <b className="text-blue-600">🟦 {q.interior}°</b>.</div>
          <div className="text-slate-800 mt-1 font-semibold">Complète la brique pour l'obtenir 👇</div>
        </div>

        {/* Brique Scratch « pivoter [dir] de [degrés] » */}
        <div className="bg-[#4a90e2] text-white rounded-lg px-3 py-3 shadow-md flex flex-wrap items-center gap-2 text-sm font-bold">
          <span>pivoter</span>
          <select value={dir} onChange={(e) => { setDir(e.target.value); setResult(null); }}
            className="rounded px-1 py-1 text-slate-800 font-bold bg-white">
            <option value="L">↺ gauche</option>
            <option value="R">↻ droite</option>
          </select>
          <span>de</span>
          <input type="number" min="0" max="180" value={deg} placeholder="?"
            onChange={(e) => { setDeg(e.target.value); setResult(null); }}
            className="w-16 rounded px-2 py-1 text-slate-800 font-bold text-center bg-white outline-none" />
          <span>degrés</span>
        </div>

        {result === null && <button onClick={check} className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-lg shadow">✅ Vérifier</button>}
        {result === 'ok' && <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 text-emerald-700 text-sm font-bold">🎉 Bravo ! {a}° + {q.interior}° = 180°.</div>}
        {result === 'ko' && <div className="bg-red-50 border border-red-300 rounded-lg p-3 text-red-700 text-sm">❌ Presque ! Il fallait <b>{answer}°</b> ({answer}° + {q.interior}° = 180°).</div>}
        {result && <button onClick={next} className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 rounded-lg shadow">➡️ Défi suivant</button>}
        <div className="text-xs text-slate-400 text-center">Score : {score.ok} / {score.total}</div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Mapping des modes (local — les composants sont exportés nommément ci-dessus)
// ------------------------------------------------------------
const ANGLE_MODES = {
  supp: { label: '① Le supplément', Comp: SupplementMode },
  tour: { label: '② Le tour complet', Comp: TourCompletMode },
  quiz: { label: '③ Quiz', Comp: QuizMode },
};

// ------------------------------------------------------------
// CONTENEUR autonome (route ?lab=angles)
// ------------------------------------------------------------
export default function AngleLab() {
  const [tab, setTab] = useState('supp');
  const { Comp } = ANGLE_MODES[tab];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 font-sans p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { window.location.href = window.location.pathname; }} className="text-sm font-bold bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50">🏠 Accueil</button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">📐 L'Atelier des angles</h1>
          <span className="w-16" />
        </div>
        <p className="text-center text-slate-500 mb-6">Pourquoi faut-il <b>tourner de 120°</b> pour dessiner un angle de <b>60°</b> ?</p>

        <div className="flex gap-2 mb-4">
          {Object.entries(ANGLE_MODES).map(([key, m]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${tab === key ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
              {m.label}
            </button>
          ))}
        </div>

        <div className="bg-white/85 backdrop-blur rounded-2xl shadow-xl border border-white/60 p-5 sm:p-6">
          <Comp />
        </div>
      </div>
    </div>
  );
}
