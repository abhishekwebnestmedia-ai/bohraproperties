import React, { useState, useEffect } from "react";
import CustomSelect from "../common/CustomSelect";
import Modal from "../common/Modal";

/** Data collected in step 1 of the two-step member-creation wizard */
export interface AddMemberStep1Data {
  domain: string;
  designation: string;
  notes: string;
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** Called with step-1 data so the parent can pass it to step 2 */
  onNext?: (data: AddMemberStep1Data) => void;
  userRole?: string;
  userDomain?: string;
};

const AddMemberModal: React.FC<Props> = ({ isOpen, onClose, onNext, userDomain }) => {
  const [domain, setDomain] = useState("property");
  const [designation, setDesignation] = useState("employee");
  const [notes, setNotes] = useState("");

  // Keep domain synced with current user default when available.
  useEffect(() => {
    if (userDomain) {
      setDomain(userDomain.toLowerCase());
    }
  }, [userDomain]);

  const handleNext = () => {
    if (typeof onNext === "function") {
      onNext({ domain, designation, notes });
    } else {
      onClose();
    }
  };

  const designationOptions = [
    { value: "employee", label: "Employee" },
    { value: "teamlead", label: "Team Lead" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} panelClassName="md:p-6 w-full max-w-md md:max-w-lg">
      <div className="max-h-[80vh] h-[75vh] flex flex-col">
        <div className="sticky top-0 z-10 px-6 pt-6 pb-3 bg-white border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Add Member</h3>
              <p className="text-sm text-gray-500">Select domain and designation (Step 1 of 2)</p>
            </div>
            <button
              aria-label="close"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 px-6 mt-4 overflow-y-auto">
          <div className="grid grid-cols-1 gap-4">
            <div className="mt-2">
              <CustomSelect
                name="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                options={[
                  { value: "property", label: "Property" },
                  { value: "finance",  label: "Finance"  },
                ]}
                placeholder="Domain"
              />
            </div>

            <div className="mt-1">
              <CustomSelect
                name="designation"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                options={designationOptions}
                placeholder="Designation"
              />
            </div>

            <div className="mt-1">
              <input
                name="notes"
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 z-10 px-6 py-4 bg-white border-t border-gray-100">
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-700 transition-colors bg-gray-100 rounded-md hover:bg-gray-200">
              Cancel
            </button>
            <button onClick={handleNext} className="px-4 py-2 text-white transition-colors bg-blue-500 rounded-md hover:bg-blue-600">
              Next
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AddMemberModal;

