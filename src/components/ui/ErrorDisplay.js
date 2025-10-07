const ErrorDisplay = ({ error, onClear }) => {
    if (!error) return null;
  
    return (
      <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded">
        <strong>Error:</strong> {error}
        <button
          onClick={onClear}
          className="float-right font-bold"
        >
          ×
        </button>
      </div>
    );
  };
  
  export default ErrorDisplay;