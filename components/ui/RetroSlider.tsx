import React, { useId } from "react";

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
  const id = useId();
  return (
    <div className="font-sans flex flex-col gap-2 bg-[#22302B] border border-[#4E665B] p-3.5 rounded-xl">
      <div className="flex justify-between items-center text-xs">
        <label
          htmlFor={id}
          className="font-sans text-xs uppercase tracking-wider text-[#A6D8B8] font-semibold cursor-pointer"
        >
          {label}
        </label>
        <span className="bg-[#182320] px-2 py-0.5 border border-[#4E665B] font-mono text-xs text-[#E9C46A] rounded">
          {displayValue !== undefined ? displayValue : value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[#6FCF97] cursor-pointer bg-[#182320] h-2 border border-[#4E665B] rounded-lg appearance-none"
      />
    </div>
  );
};
