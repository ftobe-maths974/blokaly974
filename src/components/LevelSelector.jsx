import React from 'react';

const LevelSelector = ({ levels = [], onSelect }) => (
  <div>
    <h1>Sélection de niveau</h1>
    <ul>
      {levels.map((level) => (
        <li key={level.id}>
          <div>{level.title || level.id}</div>
          <button type="button" onClick={() => onSelect(level)}>
            Lancer
          </button>
        </li>
      ))}
    </ul>
  </div>
);

export default LevelSelector;
