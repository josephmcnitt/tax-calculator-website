import React, { useState } from "react";

const SimpleTaxCalculator = () => {
  const [zipCode, setZipCode] = useState("");
  const [income, setIncome] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Federal tax brackets for 2024 (single filer)
  const federalTaxBrackets = [
    { min: 0, max: 11600, rate: 0.1 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ];

  // Federal spending breakdown (approximate percentages)
  const federalSpendingBreakdown = [
    { name: "Social Security", percentage: 21 },
    { name: "Medicare", percentage: 14 },
    { name: "Health (inc. Medicaid)", percentage: 13 },
    { name: "Defense", percentage: 13 },
    { name: "Income Security", percentage: 12 },
    { name: "Interest on Debt", percentage: 10 },
    { name: "Veterans Benefits", percentage: 4 },
    { name: "Transportation", percentage: 3 },
    { name: "Education", percentage: 2 },
    { name: "Other", percentage: 8 },
  ];

  // Calculate federal income tax
  const calculateFederalTax = (income) => {
    let tax = 0;
    let remainingIncome = income;

    for (let i = 0; i < federalTaxBrackets.length; i++) {
      const bracket = federalTaxBrackets[i];
      if (remainingIncome <= 0) break;

      const taxableInBracket = Math.min(
        bracket.max - bracket.min,
        remainingIncome
      );
      tax += taxableInBracket * bracket.rate;
      remainingIncome -= taxableInBracket;
    }

    return {
      total: tax,
      effectiveRate: (tax / income) * 100,
    };
  };

  // Calculate state income tax (simplified)
  const calculateStateTax = (income, state) => {
    // Simplified state tax calculation
    const stateRates = {
      CA: 0.093,
      NY: 0.085,
      TX: 0,
      FL: 0,
      IL: 0.0495,
      PA: 0.0307,
      OH: 0.0399,
      GA: 0.0575,
      NC: 0.0525,
      MI: 0.0425,
      NJ: 0.0637,
      VA: 0.0575,
      WA: 0,
      AZ: 0.045,
      MA: 0.05,
      TN: 0,
      IN: 0.0323,
      MO: 0.054,
      MD: 0.0575,
      WI: 0.0765,
      MN: 0.0985,
      CO: 0.0455,
      AL: 0.05,
      SC: 0.07,
      LA: 0.0425,
      KY: 0.05,
      OR: 0.099,
      OK: 0.05,
      CT: 0.0699,
      IA: 0.0625,
      MS: 0.05,
      AR: 0.055,
      KS: 0.057,
      UT: 0.0495,
      NV: 0,
      NM: 0.059,
      WV: 0.065,
      NE: 0.0684,
      ID: 0.06925,
      HI: 0.11,
      ME: 0.0715,
      NH: 0.05,
      RI: 0.0599,
      MT: 0.0675,
      DE: 0.066,
      SD: 0,
      ND: 0.029,
      AK: 0,
      VT: 0.0875,
      WY: 0,
      DC: 0.0895,
    };

    const rate = stateRates[state] || 0.05; // Default to 5% if state not found
    const tax = income * rate;

    return {
      total: tax,
      effectiveRate: rate * 100,
    };
  };

  // Calculate local tax (simplified)
  const calculateLocalTax = (income, zipCode) => {
    // Simplified local tax calculation
    // Using first digit of zip code to determine local tax rate
    const firstDigit = parseInt(zipCode.toString()[0]);
    const localRate = firstDigit * 0.001; // 0.1% to 0.9% based on first digit
    const tax = income * localRate;

    return {
      total: tax,
      effectiveRate: localRate * 100,
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Basic validation
      if (!zipCode || zipCode.length !== 5 || isNaN(parseInt(zipCode))) {
        throw new Error("Please enter a valid 5-digit ZIP code");
      }

      if (!income || isNaN(parseFloat(income)) || parseFloat(income) < 0) {
        throw new Error("Please enter a valid income amount");
      }

      const incomeValue = parseFloat(income);

      // Get state from ZIP code (simplified)
      const zipFirstDigit = parseInt(zipCode[0]);
      let state = "CA"; // Default

      // Very simplified ZIP to state mapping
      if (zipFirstDigit === 0 || zipFirstDigit === 1) state = "NY";
      else if (zipFirstDigit === 2) state = "VA";
      else if (zipFirstDigit === 3) state = "FL";
      else if (zipFirstDigit === 4) state = "MI";
      else if (zipFirstDigit === 5) state = "IL";
      else if (zipFirstDigit === 6) state = "TX";
      else if (zipFirstDigit === 7) state = "TX";
      else if (zipFirstDigit === 8) state = "CO";
      else if (zipFirstDigit === 9) state = "CA";

      // Calculate taxes
      const federalTax = calculateFederalTax(incomeValue);
      const stateTax = calculateStateTax(incomeValue, state);
      const localTax = calculateLocalTax(incomeValue, zipCode);

      const totalTax = federalTax.total + stateTax.total + localTax.total;
      const effectiveRate = (totalTax / incomeValue) * 100;

      // Set results
      setResults({
        income: incomeValue,
        state,
        zipCode,
        federal: federalTax,
        state: stateTax,
        local: localTax,
        total: totalTax,
        effectiveRate,
        takeHome: incomeValue - totalTax,
        federalBreakdown: federalSpendingBreakdown.map(item => ({
          name: item.name,
          value: (item.percentage / 100) * federalTax.total,
          percentage: item.percentage
        }))
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="tax-calculator">
      <form onSubmit={handleSubmit} className="calculator-form">
        <div className="form-group">
          <label htmlFor="zipCode">ZIP Code:</label>
          <input
            type="text"
            id="zipCode"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="Enter ZIP code"
            maxLength={5}
            className="input-field"
          />
        </div>
        <div className="form-group">
          <label htmlFor="income">Annual Income:</label>
          <input
            type="text"
            id="income"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            placeholder="Enter income"
            className="input-field"
          />
        </div>
        <button
          type="submit"
          className="calculate-button"
          disabled={loading}
        >
          {loading ? "Calculating..." : "Calculate Taxes"}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {results && (
        <div className="results-container">
          <h3 className="results-title">Tax Breakdown</h3>
          
          <div className="summary-box">
            <div className="summary-item">
              <span>Annual Income:</span>
              <span>{formatCurrency(results.income)}</span>
            </div>
            <div className="summary-item">
              <span>Total Tax:</span>
              <span>{formatCurrency(results.total)}</span>
            </div>
            <div className="summary-item">
              <span>Take-Home Pay:</span>
              <span>{formatCurrency(results.takeHome)}</span>
            </div>
            <div className="summary-item">
              <span>Effective Tax Rate:</span>
              <span>{results.effectiveRate.toFixed(2)}%</span>
            </div>
          </div>
          
          <div className="tax-breakdown">
            <h4>Tax Details</h4>
            <div className="tax-item">
              <span>Federal Tax:</span>
              <span>{formatCurrency(results.federal.total)} ({results.federal.effectiveRate.toFixed(2)}%)</span>
            </div>
            <div className="tax-item">
              <span>State Tax:</span>
              <span>{formatCurrency(results.state.total)} ({results.state.effectiveRate.toFixed(2)}%)</span>
            </div>
            <div className="tax-item">
              <span>Local Tax:</span>
              <span>{formatCurrency(results.local.total)} ({results.local.effectiveRate.toFixed(2)}%)</span>
            </div>
          </div>
          
          <div className="spending-breakdown">
            <h4>Federal Spending Breakdown</h4>
            <div className="spending-items">
              {results.federalBreakdown.map((item, index) => (
                <div key={index} className="spending-item">
                  <div className="spending-label">
                    <span className="color-indicator" style={{ backgroundColor: getColor(index) }}></span>
                    <span>{item.name}</span>
                  </div>
                  <div className="spending-value">
                    <span>{formatCurrency(item.value)}</span>
                    <span className="percentage">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .tax-calculator {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9f9f9;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .calculator-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
        }
        
        label {
          margin-bottom: 5px;
          font-weight: 500;
        }
        
        .input-field {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }
        
        .calculate-button {
          padding: 12px;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .calculate-button:hover {
          background-color: #0051a8;
        }
        
        .calculate-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        
        .error-message {
          color: #d32f2f;
          margin: 10px 0;
          padding: 10px;
          background-color: #ffebee;
          border-radius: 4px;
        }
        
        .results-container {
          margin-top: 30px;
        }
        
        .results-title {
          font-size: 20px;
          margin-bottom: 15px;
          text-align: center;
        }
        
        .summary-box {
          background-color: #e3f2fd;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .summary-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 16px;
        }
        
        .summary-item:last-child {
          margin-bottom: 0;
          font-weight: bold;
        }
        
        .tax-breakdown, .spending-breakdown {
          background-color: white;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .tax-breakdown h4, .spending-breakdown h4 {
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 18px;
        }
        
        .tax-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        
        .spending-items {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .spending-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .spending-label {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .color-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        
        .spending-value {
          display: flex;
          gap: 5px;
        }
        
        .percentage {
          color: #666;
          font-size: 14px;
        }
        
        @media (min-width: 768px) {
          .calculator-form {
            flex-direction: row;
            align-items: flex-end;
          }
          
          .form-group {
            flex: 1;
          }
          
          .calculate-button {
            align-self: flex-end;
            width: auto;
          }
        }
      `}</style>
    </div>
  );
};

// Helper function to get colors for the spending breakdown
function getColor(index) {
  const colors = [
    "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8",
    "#82ca9d", "#ffc658", "#8dd1e1", "#a4de6c", "#d0ed57"
  ];
  return colors[index % colors.length];
}

export default SimpleTaxCalculator; 