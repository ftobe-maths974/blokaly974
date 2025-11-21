import { useRef } from 'react';

const BlocklyContainer = ({ toolboxXml }) => {
  const blocklyRef = useRef(null);

  // Placeholder: Blockly will be initialized here using toolboxXml when implemented.
  void toolboxXml;

  return <div ref={blocklyRef}>blockly placeholder</div>;
};

export default BlocklyContainer;
