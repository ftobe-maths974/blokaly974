import React, { useState } from 'react';
import './App.css';
import LevelRunner from './components/LevelRunner';
import LevelSelector from './components/LevelSelector';
import levels from './levels';

function App() {
  const [selectedLevel, setSelectedLevel] = useState(null);

  return (
    <div className="App">
      {selectedLevel ? (
        <LevelRunner levelJson={selectedLevel} />
      ) : (
        <LevelSelector levels={levels} onSelect={setSelectedLevel} />
      )}
    </div>
  );
}

export default App;
