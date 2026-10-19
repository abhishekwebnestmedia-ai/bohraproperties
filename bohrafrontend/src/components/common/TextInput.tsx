import React from 'react';

type Props = {
  name?: string;
  label?: string;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** kept for API compat but unused */
  variant?: 'filled' | 'outlined' | 'standard';
  fullWidth?: boolean;
  disabled?: boolean;
  required?: boolean;
};

const TextInput: React.FC<Props> = ({
  name,
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  onFocus,
  onBlur,
  disabled = false,
  required = false,
}) => {
  const displayLabel = label ?? placeholder;
  const inputPlaceholder = label ? placeholder : undefined;

  return (
    <div className="flex flex-col gap-1">
      {displayLabel && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700"
        >
          {displayLabel}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
        onFocus={onFocus as React.FocusEventHandler<HTMLInputElement>}
        onBlur={onBlur as React.FocusEventHandler<HTMLInputElement>}
        placeholder={inputPlaceholder ?? (!displayLabel ? placeholder : undefined)}
        disabled={disabled}
        required={required}
        className="w-full px-3.5 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl
          placeholder:text-gray-400
          focus:outline-none focus:ring-0 focus:border-blue-400
          disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
          transition"
      />
    </div>
  );
};

export default TextInput;
