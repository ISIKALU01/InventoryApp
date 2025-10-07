import { FaFileImport, FaPlus } from "react-icons/fa";

const ActionButtons = ({
  onImport,
  onAdd,
  onRefresh,
  isLoading,
  isMobile,
}) => {
  // Only show mobile floating buttons
  if (!isMobile) {
    return null; // Desktop buttons are now in CustomerFilters
  }

  return (
    <div className="fixed bottom-4 right-4 md:hidden">
      <div className="flex flex-col gap-3">
        <button
          onClick={onImport}
          className="flex items-center justify-center w-12 h-12 text-white transition-transform bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 hover:scale-110"
          title="Import CSV"
          disabled={isLoading}
        >
          <FaFileImport className="text-lg" />
        </button>
        <button
          onClick={onAdd}
          className="flex items-center justify-center w-12 h-12 text-white transition-transform bg-green-600 rounded-full shadow-lg hover:bg-green-700 hover:scale-110"
          title="Add Customer"
          disabled={isLoading}
        >
          <FaPlus className="text-lg" />
        </button>
        <button
          onClick={onRefresh}
          className="flex items-center justify-center w-12 h-12 text-white transition-transform bg-gray-600 rounded-full shadow-lg hover:bg-gray-700 hover:scale-110"
          title="Refresh"
          disabled={isLoading}
        >
          ↻
        </button>
      </div>
    </div>
  );
};

export default ActionButtons;