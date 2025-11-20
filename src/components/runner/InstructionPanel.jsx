import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css'; // Le style pour les maths

export default function InstructionPanel({ title, content, isCollapsed, onToggle }) {
  return (
    <div style={{
      width: isCollapsed ? '50px' : '350px',
      background: 'white',
      borderRight: '1px solid #ccc',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s ease',
      overflow: 'hidden',
      flexShrink: 0, 
      position: 'relative',
      zIndex: 10 
    }}>
      <button 
        onClick={onToggle}
        style={{
          position: 'absolute', right: '10px', top: '10px',
          background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer',
          zIndex: 20
        }}
      >
        {isCollapsed ? '▶' : '◀'}
      </button>

      {!isCollapsed && (
        <div style={{padding: '20px', overflowY: 'auto', height: '100%'}}>
          <h2 style={{marginTop: 0, color: '#2c3e50', fontSize: '1.5rem', borderBottom: '2px solid #3498db', paddingBottom: '10px'}}>
             📘 {title || "Mission"}
          </h2>
          
          <div style={{lineHeight: '1.6', color: '#34495e', fontSize: '0.95rem'}}>
            {content ? (
                <ReactMarkdown 
                  remarkPlugins={[remarkMath]} 
                  rehypePlugins={[rehypeKatex]}
                >
                  {content}
                </ReactMarkdown>
            ) : (
                <p style={{color: '#999', fontStyle: 'italic'}}>Aucune consigne.</p>
            )}
          </div>
        </div>
      )}
      
      {isCollapsed && (
        <div 
            onClick={onToggle}
            style={{
                height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                cursor: 'pointer', writingMode: 'vertical-rl', transform: 'rotate(180deg)',
                fontWeight: 'bold', color: '#555', letterSpacing: '2px'
            }}
        >
            CONSIGNE 📘
        </div>
      )}
    </div>
  );
}