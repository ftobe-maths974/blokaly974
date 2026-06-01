import React, { useRef, useEffect } from 'react';
import * as Blockly from 'blockly';

/**
 * Wrapper minimal autour de Blockly.inject, compatible avec l'API de
 * `react-blockly` (BlocklyWorkspace) telle qu'utilisée dans le projet.
 *
 * Props supportées :
 *  - className                : classe CSS du conteneur
 *  - toolboxConfiguration     : XML de toolbox (string) — mis à jour si la prop change
 *  - workspaceConfiguration   : options passées à Blockly.inject
 *  - initialXml               : XML chargé une fois après l'injection
 *  - onInject(workspace)      : appelé après injection (+ chargement initialXml)
 *  - onXmlChange(xml)         : appelé à chaque modification (XML sérialisé)
 *
 * Le remount (changement de toolbox de catégories, de type de niveau, etc.)
 * se gère via la prop `key` côté appelant, comme avec react-blockly.
 */
export function BlocklyWorkspace({
  className,
  toolboxConfiguration,
  workspaceConfiguration = {},
  initialXml,
  onInject,
  onXmlChange,
}) {
  const containerRef = useRef(null);
  const workspaceRef = useRef(null);

  // Refs sur les callbacks : évite de ré-injecter Blockly si l'appelant
  // recrée ses fonctions à chaque rendu.
  const onInjectRef = useRef(onInject);
  const onXmlChangeRef = useRef(onXmlChange);

  // Synchronisation des refs hors render (déclaré AVANT l'effet d'injection
  // pour que les refs soient à jour quand l'injection s'exécute au montage).
  useEffect(() => {
    onInjectRef.current = onInject;
    onXmlChangeRef.current = onXmlChange;
  });

  // --- Injection (au montage uniquement) ---
  useEffect(() => {
    if (!containerRef.current) return;

    const ws = Blockly.inject(containerRef.current, {
      ...workspaceConfiguration,
      toolbox: toolboxConfiguration,
    });
    workspaceRef.current = ws;

    // Chargement initial (avant onInject, comme react-blockly)
    if (initialXml) {
      try {
        const dom = Blockly.utils.xml.textToDom(initialXml);
        Blockly.Xml.domToWorkspace(dom, ws);
      } catch (e) {
        console.warn('BlocklyWorkspace: initialXml invalide', e);
      }
    }

    onInjectRef.current?.(ws);

    // Remontée des changements (XML sérialisé), hors événements purement UI
    const listener = (e) => {
      if (ws.isDragging()) return;
      if (e && e.isUiEvent) return;
      if (!onXmlChangeRef.current) return;
      const xml = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(ws));
      onXmlChangeRef.current(xml);
    };
    ws.addChangeListener(listener);

    // Redimensionnement initial (le conteneur peut ne pas avoir sa taille finale)
    const resizeTimer = window.setTimeout(() => Blockly.svgResize(ws), 0);

    return () => {
      window.clearTimeout(resizeTimer);
      ws.removeChangeListener(listener);
      ws.dispose();
      workspaceRef.current = null;
    };
    // Montage unique : le remount éventuel passe par la prop `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Mise à jour de la toolbox si la prop change ---
  useEffect(() => {
    if (workspaceRef.current && toolboxConfiguration) {
      workspaceRef.current.updateToolbox(toolboxConfiguration);
    }
  }, [toolboxConfiguration]);

  return <div ref={containerRef} className={className} style={{ width: '100%', height: '100%' }} />;
}

export default BlocklyWorkspace;
