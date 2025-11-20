export const generateProofToken = (levelId, scoreData) => {
    // scoreData = { stars: 3, blocks: 5 }
    
    const dateCode = new Date().getHours(); // Petit sel temporel basique
    const rawString = `LVL:${levelId}|ST:${scoreData.stars}|BL:${scoreData.blocks}`;
    
    // Simulation d'une signature (Hash simple pour l'exemple)
    let hash = 0;
    for (let i = 0; i < rawString.length; i++) {
      const char = rawString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char + dateCode;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Format final : "LVL:1|ST:3|BL:5|#1928302"
    return `${rawString}|#${Math.abs(hash).toString(16)}`;
  };
