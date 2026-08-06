import React from "react";

interface RetroSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  displayValue?: string | number;
}

export const RetroSlider: React.FC<RetroSliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  displayValue,
}) => {
  return (
    <div className="font-vt323 flex flex-col gap-1.5 bg-[#1e140e] border-2 border-[#382219] p-3 shadow-[3px_3px_0px_0px_#0f0a07]">
      <div className="flex justify-between items-center text-sm">
        <span className="font-pixel text-[10px] uppercase tracking-wider text-[#a3b18a] font-bold">
          {label}
        </span>
        <span className="bg-[#3e271c] px-2 py-0.5 border border-[#1e140e] font-vt323 text-lg text-[#dda15e]">
          {displayValue !== undefined ? displayValue : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[#dda15e] cursor-pointer bg-[#281b12] h-3 border-2 border-[#382219] rounded-none appearance-none"
      />
    </div>
  );
};
