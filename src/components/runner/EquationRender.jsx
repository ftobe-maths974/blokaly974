import React, { useEffect, useState } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

export default function EquationRender({ state }) {
  // Protection contre un état vide
  const safeState = state || { lhs: "", rhs: "", sign: "=" };

  const [displayState, setDisplayState] = useState(safeState);
  const [animating, setAnimating] = useState(false);

  // Mise à jour quand l'état change (ex: nouvelle opération)
  useEffect(() => {
    if (state && state.lastOp) {
      // PHASE 1 : Animation (Opération en rouge)
      setAnimating(true);
      
      // PHASE 2 : Résultat simplifié après 1.5s
      const timer = setTimeout(() => {
        setAnimating(false);
        setDisplayState(state);
      }, 1500);
      
      return () => clearTimeout(timer);
    } else if (state) {
      // Pas d'animation, mise à jour directe
      setDisplayState(state);
    }
  }, [state]);

  const formatOp = (op) => {
    if (op === '*') return '\\times';
    if (op === '/') return '\\div';
    return op;
  };

  // --- C'EST ICI QUE LA CORRECTION EST IMPORTANTE ---
  // On force la conversion en String avec String() ou || ""
  // pour éviter que KaTeX ne plante sur du undefined.
  
  let lhsTex = String(displayState.lhs || "");
  let rhsTex = String(displayState.rhs || "");
  const signTex = String(displayState.sign || "=");

  if (animating && state.lastOp) {
    const opTex = `{\\color{#e74c3c} ${formatOp(state.lastOp.op)} ${state.lastOp.val}}`;
    lhsTex = `${lhsTex} ${opTex}`;
    rhsTex = `${rhsTex} ${opTex}`;
  }
  // --------------------------------------------------

  return (
    <div style={styles.board}>
      <div style={styles.equation}>
        {/* Membre de Gauche */}
        <div style={styles.member}>
           {/* Protection : on n'affiche le composant que s'il y a du texte */}
           {lhsTex ? <InlineMath math={lhsTex} /> : <span>?</span>}
        </div>
        
        {/* Signe */}
        <div style={styles.sign}>
           <InlineMath math={signTex} />
        </div>

        {/* Membre de Droite */}
        <div style={styles.member}>
           {rhsTex ? <InlineMath math={rhsTex} /> : <span>?</span>}
        </div>
      </div>
      
      <div style={styles.hint}>
        {animating ? "Calcul en cours..." : "En attente d'instructions"}
      </div>
    </div>
  );
}

const styles = {
  board: {
    width: '100%', height: '100%',
    background: '#fff', 
    display: 'flex', flexDirection: 'column', 
    justifyContent: 'center', alignItems: 'center',
    fontFamily: 'sans-serif'
  },
  equation: {
    display: 'flex', alignItems: 'center', gap: '20px',
    fontSize: '2.5rem', color: '#2c3e50'
  },
  member: {
    padding: '10px 20px',
    background: '#f8f9fa',
    borderRadius: '10px',
    borderBottom: '4px solid #bdc3c7',
    minWidth: '100px', textAlign: 'center',
    minHeight: '60px', // Hauteur min pour éviter les sauts
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  sign: {
    fontSize: '2rem', color: '#7f8c8d'
  },
  hint: {
    marginTop: '30px', color: '#95a5a6', fontStyle: 'italic'
  }
};