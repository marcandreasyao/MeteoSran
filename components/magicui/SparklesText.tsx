import React, { useEffect, useState } from 'react';

interface SparkleProps {
  id: string;
  color: string;
  delay: number;
}

const SparkleSVG: React.FC<SparkleProps> = ({ color, delay }) => {
  const [position, setPosition] = useState({
    x: `${Math.random() * 100}%`,
    y: `${Math.random() * 100}%`,
    scale: Math.random() * 0.7 + 0.4,
  });

  return (
    <svg
      className="pointer-events-none absolute z-20 sparkle-svg"
      style={{
        left: position.x,
        top: position.y,
        animationDelay: `${delay}s`,
        '--sparkle-scale': position.scale,
      } as React.CSSProperties}
      width="18"
      height="18"
      viewBox="0 0 21 21"
      onAnimationIteration={() => {
        setPosition({
          x: `${Math.random() * 100}%`,
          y: `${Math.random() * 100}%`,
          scale: Math.random() * 0.7 + 0.4,
        });
      }}
    >
      <path
        d="M9.82531 0.843845C10.0553 0.215178 10.9446 0.215178 11.1746 0.843845L11.8618 2.72026C12.4006 4.19229 12.3916 6.39157 13.5 7.5C14.6084 8.60843 16.8077 8.59935 18.2797 9.13822L20.1561 9.82534C20.7858 10.0553 20.7858 10.9447 20.1561 11.1747L18.2797 11.8618C16.8077 12.4007 14.6084 12.3916 13.5 13.5C12.3916 14.6084 12.4006 16.8077 11.8618 18.2798L11.1746 20.1562C10.9446 20.7858 10.0553 20.7858 9.82531 20.1562L9.13819 18.2798C8.59932 16.8077 8.60843 14.6084 7.5 13.5C6.39157 12.3916 4.19225 12.4007 2.72023 11.8618L0.843814 11.1747C0.215148 10.9447 0.215148 10.0553 0.843814 9.82534L2.72023 9.13822C4.19225 8.59935 6.39157 8.60843 7.5 7.5C8.60843 6.39157 8.59932 4.19229 9.13819 2.72026L9.82531 0.843845Z"
        fill={color}
      />
    </svg>
  );
};

interface SparklesTextProps {
  children: React.ReactNode;
  className?: string;
  sparklesCount?: number;
  colors?: {
    first: string;
    second: string;
  };
}

export const SparklesText: React.FC<SparklesTextProps> = ({
  children,
  colors = { first: '#0ea5e9', second: '#6366f1' }, // Default theme colors of MeteoSran (Sky Blue & Indigo)
  className = '',
  sparklesCount = 6,
}) => {
  const [sparkles, setSparkles] = useState<{ id: string; color: string; delay: number }[]>([]);

  useEffect(() => {
    const initializeStars = () => {
      const newSparkles = Array.from({ length: sparklesCount }, (_, i) => ({
        id: `sparkle-${i}-${Math.random()}`,
        color: Math.random() > 0.5 ? colors.first : colors.second,
        delay: Math.random() * 2, // random delay from 0 to 2s
      }));
      setSparkles(newSparkles);
    };

    initializeStars();
  }, [colors.first, colors.second, sparklesCount]);

  return (
    <span className={`relative inline-block ${className}`}>
      <style>{`
        @keyframes sparkle-animation {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0) rotate(0deg);
          }
          40% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(var(--sparkle-scale)) rotate(140deg);
          }
          60% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(var(--sparkle-scale)) rotate(220deg);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0) rotate(360deg);
          }
        }
        .sparkle-svg {
          animation: sparkle-animation 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
        }
      `}</style>
      
      {sparkles.map((sparkle) => (
        <SparkleSVG key={sparkle.id} color={sparkle.color} delay={sparkle.delay} id={sparkle.id} />
      ))}
      <span className="relative z-10">{children}</span>
    </span>
  );
};
