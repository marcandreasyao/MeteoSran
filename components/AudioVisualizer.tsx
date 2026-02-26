import React from 'react';

interface AudioVisualizerProps {
    audioData: Uint8Array | null;
    isListening: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioData, isListening }) => {
    if (!isListening) return null;

    // Render 30 bars to create a smooth wave effect
    const numBars = 30;

    const bars = Array.from({ length: numBars }).map((_, i) => {
        let height = 4; // minimum height
        if (audioData && audioData.length > 0) {
            // Sample from the frequency data (skipping the highest frequencies which are often empty)
            const dataIndex = Math.floor((i / numBars) * (audioData.length * 0.7));
            const value = audioData[dataIndex];

            // Normalize value from 0-255 to a height (min 4px, max 36px)
            const normalized = value / 255;
            height = Math.max(4, normalized * 36);

            // Add a slight boost to the middle bars for a visual "arc"
            const distanceFromCenter = Math.abs((numBars / 2) - i);
            const centerBoost = Math.max(0, 1 - (distanceFromCenter / (numBars / 2)));
            height += (normalized * centerBoost * 12);
        }

        return (
            <div
                key={i}
                className="w-1 md:w-1.5 bg-gradient-to-t from-sky-400 to-sky-600 dark:from-sky-500 dark:to-sky-300 rounded-full transition-all duration-75 ease-out shadow-sm"
                style={{ height: `${height}px` }}
            />
        );
    });

    return (
        <div className="flex items-center justify-center gap-1 min-h-[48px] w-full px-2 overflow-hidden animate-fade-in">
            {bars}
        </div>
    );
};
