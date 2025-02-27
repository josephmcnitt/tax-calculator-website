import '../App.css';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

function MyApp({ Component, pageProps }) {
  const [isClient, setIsClient] = useState(false);

  // This effect will only run on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      {/* Add error boundary for better error handling */}
      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>
    </>
  );
}

// Simple error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="mb-2">The application encountered an error. Please try refreshing the page.</p>
          <details className="text-sm">
            <summary>Error details</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
              {this.state.error && this.state.error.toString()}
            </pre>
          </details>
          <button
            className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Import React for the ErrorBoundary class component
import React from 'react';

export default MyApp; 