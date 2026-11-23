import SystemLoader from "./SystemLoader";

// Inline loading state for page sections (see SystemLoader for the full screen one)
const LoadingSpinner = ({ message = "Loading" }) => (
  <SystemLoader variant="inline" message={message.replace(/\.+$/, "")} />
);

export default LoadingSpinner;
