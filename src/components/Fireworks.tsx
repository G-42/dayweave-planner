import { useEffect, useState } from 'react';

interface FireworksProps {
  show: boolean;
  onComplete?: () => void;
}

export const Fireworks = ({ show, onComplete }: FireworksProps) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);

  useEffect(() => {
    if (show) {
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'][Math.floor(Math.random() * 6)]
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full animate-firework"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            animationDelay: `${Math.random() * 0.5}s`
          }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-4xl font-bold text-primary animate-bounce">
          🎉 目標達成おめでとう！ 🎉
        </div>
      </div>
    </div>
  );
};