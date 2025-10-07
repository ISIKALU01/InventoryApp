const LoadingSpinner = ({ message = "Loading..." }) => {
    return (
      <div className="py-12 text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
      </div>
    );
  };
  
  export default LoadingSpinner;