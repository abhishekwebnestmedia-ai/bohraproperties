import React from 'react';

type ToggleOption = {
  value: string;
  label: string;
};

type Props = {
  options: ToggleOption[];
  activeValue: string;
  onChange: (value: string) => void;
  className?: string;
};

const ToggleButton: React.FC<Props> = ({ options, activeValue, onChange, className = '' }) => {
  const activeIndex = options.findIndex(o => o.value === activeValue);
  const isDead = activeValue === 'Dead';
  return (
    <div
      className={`relative inline-grid p-1 bg-gray-50 rounded-lg ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
    >
      {/* Sliding pill */}
      <span
        className={`absolute transition-all duration-300 ease-in-out rounded-md pointer-events-none top-1 bottom-1 ${
          isDead ? 'bg-red-600' : 'bg-black'
        }`}
        style={{
          left: '4px',
          width: `calc((100% - 8px) / ${options.length})`,
          transform: `translateX(calc(${activeIndex} * 100%))`,
        }}
      />
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`relative z-10 text-sm font-medium focus:outline-none flex items-center justify-center px-2 py-1 transition-colors duration-300 ${
            activeValue === option.value
              ? isDead ? 'text-red-100' : 'text-white'
              : option.value === 'Dead'
                ? 'text-red-500 hover:text-red-700'
                : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default ToggleButton;
