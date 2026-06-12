import React from 'react';

// Boussole « soleil opale » — SOURCE UNIQUE partagée par le Runner (jeu) et
// l'Editor (builder) : garantit « la même flèche » des deux côtés, sans dérive.
// Dimensionnement en container query units (cqmin) → s'adapte à n'importe quelle
// taille de cellule sans dépendre de --cell-size. La cellule/conteneur parent
// DOIT porter container-type:size (sinon cqmin ne se résout pas).
export const COMPASS_CSS = `
.maze-compass-wrap{position:absolute;inset:0;display:flex;justify-content:center;align-items:center;z-index:10;transition:transform .25s ease}
.maze-compass{position:relative;width:78%;height:78%;border-radius:50%;background:radial-gradient(circle at 34% 30%,#ffffff 0%,#eaf2ff 45%,#c8d6f0 80%,#b3c4e6 100%);box-shadow:0 0 18cqmin rgba(255,245,200,.85),0 2px 3px rgba(0,0,0,.3),inset 0 0 4px rgba(255,255,255,.9);border:1.5px solid rgba(255,255,255,.85);display:flex;justify-content:center;align-items:center}
.maze-compass-arrow{width:0;height:0;border-left:16cqmin solid transparent;border-right:16cqmin solid transparent;border-bottom:42cqmin solid #1a1a1a;transform:translateY(-8%);filter:drop-shadow(0 1px 1px rgba(0,0,0,.4))}
`;

/** Boussole orientée (vue de dessus). `rotation` en degrés (0 = flèche vers le haut = Nord). */
export default function MazeCompass({ rotation = 0 }) {
  return (
    <div className="maze-compass-wrap" style={{ transform: `rotate(${rotation}deg)` }}>
      <div className="maze-compass"><div className="maze-compass-arrow" /></div>
    </div>
  );
}
