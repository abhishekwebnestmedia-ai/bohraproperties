import React from 'react';
import TextField from '@mui/material/TextField';

type Props = {
  name?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  variant?: 'filled' | 'outlined' | 'standard';
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  disabled?: boolean;
  sx?: any;
};

const SingleLineInput: React.FC<Props> = ({
  name,
  label,
  placeholder,
  value,
  onChange,
  variant = 'outlined',
  fullWidth = true,
  size = 'small',
  disabled = false,
  sx,
}) => {
  const computedLabel = label || placeholder || undefined;
  const computedPlaceholder = label ? placeholder : undefined;

  return (
    <TextField
      name={name}
      label={computedLabel}
      placeholder={computedPlaceholder}
      value={value}
      onChange={(e) => onChange ? onChange(e) : undefined}
      variant={variant}
      fullWidth={fullWidth}
      size={size}
      disabled={disabled}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: '12px',
          backgroundColor: 'transparent',
        },
        '& .MuiInputBase-input': {
          paddingTop: '10px',
          paddingBottom: '10px',
        },
        ...(sx as any || {}),
      }}
    />
  );
};

export default SingleLineInput;
