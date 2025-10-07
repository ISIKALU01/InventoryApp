import { useState } from "react";
import { FaTimes } from "react-icons/fa";

const ImportCSVModal = ({ isOpen, onClose, onImport }) => {
  const [csvFile, setCsvFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Importing CSV with:", { csvFile });
    onImport({ csvFile });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            Import Customers from CSV
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              CSV File *
            </label>
            <div className="p-4 text-center border-2 border-gray-300 border-dashed rounded-md">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files[0])}
                required
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="mt-2 text-xs text-gray-500">
                Upload a CSV file with customer data
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700"
            >
              Import Customers
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImportCSVModal;