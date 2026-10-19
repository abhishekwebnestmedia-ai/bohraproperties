import React from 'react';

type RangeOption = {
  value: string;
  label: string;
};

type Props = {
  options: RangeOption[];
  activeValue: string;
  onChange: (value: string) => void;
  className?: string;
};

const RangeToggle: React.FC<Props> = ({ options, activeValue, onChange, className = '' }) => {
  const activeIndex = options.findIndex(o => o.value === activeValue);
  return (
    <div
      className={`relative inline-grid p-1 bg-gray-50 rounded-lg ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
    >
      {/* Sliding pill */}
      <span
        className="absolute top-1 bottom-1 rounded-md bg-black pointer-events-none transition-transform duration-300 ease-in-out"
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
          className={`relative z-10 text-sm font-medium focus:outline-none flex items-center justify-center px-3 py-1 transition-colors duration-300 ${
            activeValue === option.value ? 'text-white' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default RangeToggle;
