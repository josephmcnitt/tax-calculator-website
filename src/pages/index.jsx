import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import components with SSR disabled to prevent window/navigator errors
const ChatBot = dynamic(() => import('../components/ChatBot'), { ssr: false });
const TaxCalculator = dynamic(() => import('../TaxCalculator'), { ssr: false });

export default function Home() {
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
          <TaxCalculator />
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