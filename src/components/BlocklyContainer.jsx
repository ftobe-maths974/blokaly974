import { useEffect, useRef } from 'react';
import * as Blockly from 'blockly';

const BlocklyContainer = ({ onWorkspaceCreated, toolboxXml }) => {
  const blocklyRef = useRef(null);
  const workspaceRef = useRef(null);

  useEffect(() => {
    if (!blocklyRef.current) return undefined;

    const workspace = Blockly.inject(blocklyRef.current, { toolbox: toolboxXml });
    workspaceRef.current = workspace;
    if (onWorkspaceCreated) {
      onWorkspaceCreated(workspace);
    }

    Blockly.svgResize(workspace);

    const handleResize = () => Blockly.svgResize(workspace);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      workspace.dispose();
      workspaceRef.current = null;
    };
  }, [onWorkspaceCreated, toolboxXml]);

  return <div ref={blocklyRef} />;
};

export default BlocklyContainer;
