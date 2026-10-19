import React, { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import dayjs, { Dayjs } from 'dayjs';
import { ChevronDownIcon } from 'lucide-react';

type Props = {
  value: [Dayjs | null, Dayjs | null];
  onChange: (newValue: [Dayjs | null, Dayjs | null]) => void;
  label?: string;
};

const RangeDatePicker: React.FC<Props> = ({ value, onChange, label = 'Date Range' }) => {
  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);
  const [from, to] = value;

  return (
    <div className="flex space-x-4">
      <div className="relative">
        <label className="block text-sm font-medium">{label} From</label>
        <button
          onClick={() => setOpenFrom(!openFrom)}
          className="flex items-center justify-between w-32 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
        >
          {from ? dayjs(from).format('DD MMM YYYY') : 'Select date'}
          <ChevronDownIcon className="w-4 h-4" />
        </button>
        {openFrom && (
          <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            <DayPicker
              mode="single"
              selected={from ? from.toDate() : undefined}
              onSelect={(date) => {
                const newFrom = date ? dayjs(date) : null;
                onChange([newFrom, to]);
                setOpenFrom(false);
              }}
            />
          </div>
        )}
      </div>
      <div className="relative">
        <label className="block text-sm font-medium">To</label>
        <button
          onClick={() => setOpenTo(!openTo)}
          className="flex items-center justify-between w-32 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
        >
          {to ? dayjs(to).format('DD MMM YYYY') : 'Select date'}
          <ChevronDownIcon className="w-4 h-4" />
        </button>
        {openTo && (
          <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            <DayPicker
              mode="single"
              selected={to ? to.toDate() : undefined}
              onSelect={(date) => {
                const newTo = date ? dayjs(date) : null;
                onChange([from, newTo]);
                setOpenTo(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export { RangeDatePicker };
