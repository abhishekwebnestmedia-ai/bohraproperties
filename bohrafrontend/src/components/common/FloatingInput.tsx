import React from 'react';
import { type ReactNode } from 'react';

type Props = {
  id?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
  required?: boolean;
  className?: string;
};

const FloatingInput: React.FC<Props> = ({
  id,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  disabled = false,
  leftIcon,
  rightElement,
  required = false,
  className = '',
}) => {
  const inputId = id || `fi-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className={`relative ${className}`}>
      {leftIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {leftIcon}
        </div>
      )}

      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder=" "
        aria-label={placeholder}
        className={`peer block w-full appearance-none bg-white border border-gray-300 rounded-xl text-sm
          ${leftIcon ? 'pl-10' : 'pl-3'} ${rightElement ? 'pr-10' : 'pr-3'} py-2.5
          placeholder-transparent focus:outline-none focus:ring-0 focus:border-gray-300
          disabled:bg-gray-50 disabled:text-gray-400 transition`}
        />

      <label
        htmlFor={inputId}
        className={`absolute left-${leftIcon ? '10' : '3'} top-2 text-sm text-gray-400 pointer-events-none
          transform origin-left transition-all
          peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm
          peer-focus:-translate-y-3 peer-focus:scale-90 peer-focus:text-xs`}
      >
        {placeholder}{required ? ' *' : ''}
      </label>

      {rightElement && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {rightElement}
        </div>
      )}
    </div>
  );
};

export default FloatingInput;
