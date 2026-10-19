import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";
import CustomSelect from "../common/CustomSelect";
import TextInput from "../common/TextInput";
import type { SpendingEntry } from "../../services/spendingService";
import { useCreateSpending, useUpdateSpending } from "../../hooks/useSpendings";
import toast from "react-hot-toast";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  spending?: SpendingEntry | null;
};

const spendingTypeOptions = [
  { value: 'Meta', label: 'Meta' },
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Google', label: 'Google' },
  { value: 'Referral', label: 'Referral' },
  { value: '99Acres', label: '99Acres' },
  { value: 'Walk in', label: 'Walk in' },
  { value: 'Other', label: 'Other' },
];

const SpendingModal: React.FC<Props> = ({ isOpen, onClose, mode, spending }) => {
  const createSpending = useCreateSpending();
  const updateSpending = useUpdateSpending();
  
  const [form, setForm] = useState({
    type: '',
    amount: '',
    note: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && spending) {
      setForm({
        type: spending.type,
        amount: spending.amount.toString(),
        note: spending.note ?? '',
      });
    } else {
      setForm({
        type: '',
        amount: '',
        note: '',
      });
    }
  }, [mode, spending, isOpen]);

  const handleChange = (key: string) => (e: any) => {
    const value = e?.target ? e.target.value : e;
    setForm((s) => ({ ...s, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!form.type || !form.amount) {
        toast.error('Type and amount are required');
        return;
      }

      const amount = parseFloat(form.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      if (mode === 'add') {
        await createSpending.mutateAsync({
          type: form.type,
          amount,
          note: form.note,
        });
      } else if (mode === 'edit' && spending) {
        await updateSpending.mutateAsync({
          id: spending._id,
          data: {
            type: form.type,
            amount,
            note: form.note,
          },
        });
      }

      handleClose();
      toast.success(mode === 'add' ? 'Spending added successfully' : 'Spending updated successfully');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save spending';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({
      type: '',
      amount: '',
      note: '',
    });
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} panelClassName="max-w-md">
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {mode === 'add' ? 'Add New Spending' : 'Update Spending'}
            </h3>
          </div>
          <button
            aria-label="close"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Type
            </label>
            <CustomSelect
              placeholder="Select Type"
              value={form.type}
              onChange={handleChange('type')}
              options={spendingTypeOptions}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Amount
            </label>
            <TextInput
              placeholder="Enter amount"
              value={form.amount}
              onChange={handleChange('amount')}
              type="number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Note
            </label>
            <TextInput
              placeholder="Enter note"
              value={form.note}
              onChange={handleChange('note')}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white bg-cyan-500 rounded-md hover:bg-cyan-600 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SpendingModal;

