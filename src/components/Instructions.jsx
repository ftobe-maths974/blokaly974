import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';

const MATHJAX_SCRIPT_ID = 'mathjax-tex-mml-chtml';
const MATHJAX_SCRIPT_SRC = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';

const ensureMathJaxScript = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  let script = document.getElementById(MATHJAX_SCRIPT_ID);

  if (!script) {
    script = document.createElement('script');
    script.id = MATHJAX_SCRIPT_ID;
    script.src = MATHJAX_SCRIPT_SRC;
    script.async = true;
    document.head.appendChild(script);
  }

  return script;
};

const typesetMath = (element) => {
  if (typeof window === 'undefined' || !window.MathJax || !element) {
    const script = ensureMathJaxScript();

    if (script && element) {
      script.addEventListener('load', () => {
        if (window.MathJax) {
          window.MathJax.typesetPromise([element]).catch(() => {});
        }
      }, { once: true });
    }

    return null;
  }

  window.MathJax.typesetPromise([element]).catch(() => {});
};

const MathJaxElement = ({ latex, inline }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    ensureMathJaxScript();
  }, []);

  useEffect(() => {
    typesetMath(containerRef.current);
  }, [latex]);

  const content = inline ? `\\(${latex}\\)` : `\\[${latex}\\]`;
  const Wrapper = inline ? 'span' : 'div';

  return <Wrapper ref={containerRef}>{content}</Wrapper>;
};

const markdownComponents = {
  math({ value }) {
    return <MathJaxElement latex={value ?? ''} inline={false} />;
  },
  inlineMath({ value }) {
    return <MathJaxElement latex={value ?? ''} inline />;
  },
};

const Instructions = ({ text, format }) => {
  if (format !== 'markdown+mathjax') {
    return <div>{text}</div>;
  }

  return (
    <ReactMarkdown remarkPlugins={[remarkMath]} components={markdownComponents}>
      {text}
    </ReactMarkdown>
  );
};

export default Instructions;
