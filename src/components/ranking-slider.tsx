"use client";

interface RankingSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function RankingSlider({ value, onChange }: RankingSliderProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 whitespace-nowrap">Breaking</span>
      <input
        type="range"
        min={0}
        max={100}
        value={value * 100}
        onChange={(e) => onChange(parseInt(e.target.value) / 100)}
        className="w-32 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        aria-label="Content preference: breaking news vs deep analysis"
      />
      <span className="text-xs text-gray-500 whitespace-nowrap">Analysis</span>
    </div>
  );
}
