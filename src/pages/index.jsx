import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import components with SSR disabled to prevent window/navigator errors
const ChatBot = dynamic(() => import('../components/ChatBot'), { ssr: false });

// Dynamically import SimpleTaxCalculator as a fallback
const SimpleTaxCalculator = dynamic(() => import('../SimpleTaxCalculator'), { 
  ssr: false,
  loading: () => <div>Loading simplified tax calculator...</div>
});

// Dynamically import TaxCalculator with error handling
const TaxCalculator = dynamic(
  () => import('../TaxCalculator').catch(err => {
    console.error('Failed to load TaxCalculator:', err);
    return () => (
      <div className="error-container">
        <h3>Tax Calculator Unavailable</h3>
        <p>We're experiencing technical difficulties loading the tax calculator. Please try again later.</p>
      </div>
    );
  }),
  { 
    ssr: false,
    loading: () => <div>Loading tax calculator...</div>
  }
);

export default function Home() {
  const [calculatorError, setCalculatorError] = useState(false);
  const [useSimplified, setUseSimplified] = useState(false);

  // Check if required dependencies are available
  useEffect(() => {
    const checkDependencies = async () => {
      try {
        // Try to dynamically import recharts to check if it's available
        await import('recharts');
      } catch (error) {
        console.error('Recharts dependency missing:', error);
        setCalculatorError(true);
        setUseSimplified(true);
      }
    };

    if (typeof window !== 'undefined') {
      checkDependencies();
    }
  }, []);

  return (
    <div className="container">
      <main>
        <h1 className="title">
          Tax Calculator and Information
        </h1>
        <p className="description">
          Calculate your taxes and ask questions about taxes, government spending, or financial matters.
        </p>
        
        {/* Tax Calculator Section */}
        <div className="calculator-section">
          <h2 className="section-title">Tax Breakdown Calculator</h2>
          {calculatorError ? (
            useSimplified ? (
              <div>
                <p className="simplified-notice">Using simplified calculator version</p>
                <SimpleTaxCalculator />
              </div>
            ) : (
              <div className="error-container">
                <h3>Tax Calculator Unavailable</h3>
                <p>We're experiencing technical difficulties loading the tax calculator. Please try again later.</p>
              </div>
            )
          ) : (
            <TaxCalculator />
          )}
        </div>
        
        {/* ChatBot Section */}
        <div className="chatbot-section">
          <h2 className="section-title">Tax Assistant</h2>
          <ChatBot />
        </div>
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        main {
          padding: 2rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 1200px;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 3rem;
          text-align: center;
        }

        .description {
          text-align: center;
          line-height: 1.5;
          font-size: 1.2rem;
          margin: 1rem 0 2rem;
        }
        
        .section-title {
          font-size: 1.8rem;
          margin: 2rem 0 1rem;
          text-align: center;
        }
        
        .calculator-section, .chatbot-section {
          width: 100%;
          margin-bottom: 3rem;
        }
        
        .error-container {
          padding: 1.5rem;
          background-color: #fff8f8;
          border: 1px solid #ffcdd2;
          border-radius: 0.5rem;
          text-align: center;
          margin: 1rem 0;
        }
        
        .error-container h3 {
          color: #d32f2f;
          margin-top: 0;
        }
        
        .simplified-notice {
          text-align: center;
          color: #ff9800;
          font-style: italic;
          margin-bottom: 1rem;
        }
        
        @media (min-width: 768px) {
          .title {
            font-size: 4rem;
          }
          
          .description {
            font-size: 1.5rem;
          }
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
} 