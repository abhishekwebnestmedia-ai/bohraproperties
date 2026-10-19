import React from 'react';
import TextField from '@mui/material/TextField';

type Props = {
  name?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  rows?: number;
  maxRows?: number;
  variant?: 'filled' | 'outlined' | 'standard';
  fullWidth?: boolean;
};

const MultiLineInput: React.FC<Props> = ({
  name,
  label,
  placeholder,
  value,
  onChange,
  rows = 3,
  maxRows,
  variant = 'outlined',
  fullWidth = true,
}) => {
  // If label is undefined/null/empty, fall back to placeholder so text floats as a label
  const computedLabel = label || placeholder || undefined;
  // Only keep a placeholder if an explicit non-empty label was provided
  const computedPlaceholder = label ? placeholder : undefined;

  return (
    <TextField
      name={name}
      label={computedLabel}
      placeholder={computedPlaceholder}
      multiline
      rows={rows}
      maxRows={maxRows}
      value={value}
      onChange={onChange}
      variant={variant}
      fullWidth={fullWidth}
      sx={{
        '& .MuiOutlinedInput-root, & .MuiFilledInput-root': {
          borderRadius: '12px',
          minHeight: '88px',
        },
        '& .MuiInputBase-input': {
          paddingTop: '12px',
          paddingBottom: '12px',
        },
      }}
    />
  );
};

export default MultiLineInput;
