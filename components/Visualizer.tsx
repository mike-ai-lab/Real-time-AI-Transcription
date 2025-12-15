import React from 'react';

interface VisualizerProps {
  level: number;
  isActive: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ level, isActive }) => {
  // Create a few bars to visualize
  const bars = 5;
  
  return (
    <div className="flex items-center gap-1 h-8">
      {Array.from({ length: bars }).map((_, i) => {
        // Pseudo-random height variation based on level
        const heightMultiplier = Math.max(0.2, Math.min(1, level * (3 + i % 3)));
        const height = isActive ? `${heightMultiplier * 100}%` : '10%';
        
        return (
          <div
            key={i}
            className={`w-1.5 rounded-full transition-all duration-75 ease-in-out ${
              isActive ? 'bg-rose-500' : 'bg-slate-300'
            }`}
            style={{ height }}
          />
        );
      })}
    </div>
  );
};

export default Visualizer;