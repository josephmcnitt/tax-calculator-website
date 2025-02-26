import React, { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import _ from "lodash";

const TaxCalculator = () => {
  const [zipCode, setZipCode] = useState("");
  const [income, setIncome] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stateInfo, setStateInfo] = useState(null);

  // Colors for charts
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#8dd1e1",
    "#a4de6c",
    "#d0ed57",
  ];

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

  // State tax data (simplified)
  const stateTaxData = {
    AL: { name: "Alabama", rate: 0.05, hasLocalIncomeTax: false },
    AK: { name: "Alaska", rate: 0.0, hasLocalIncomeTax: false },
    AZ: { name: "Arizona", rate: 0.025, hasLocalIncomeTax: false },
    AR: { name: "Arkansas", rate: 0.055, hasLocalIncomeTax: false },
    CA: { name: "California", rate: 0.093, hasLocalIncomeTax: false },
    CO: { name: "Colorado", rate: 0.0455, hasLocalIncomeTax: false },
    CT: { name: "Connecticut", rate: 0.0699, hasLocalIncomeTax: false },
    DE: { name: "Delaware", rate: 0.066, hasLocalIncomeTax: false },
    FL: { name: "Florida", rate: 0.0, hasLocalIncomeTax: false },
    GA: { name: "Georgia", rate: 0.0575, hasLocalIncomeTax: false },
    HI: { name: "Hawaii", rate: 0.11, hasLocalIncomeTax: false },
    ID: { name: "Idaho", rate: 0.06, hasLocalIncomeTax: false },
    IL: { name: "Illinois", rate: 0.0495, hasLocalIncomeTax: false },
    IN: { name: "Indiana", rate: 0.0323, hasLocalIncomeTax: true },
    IA: { name: "Iowa", rate: 0.0575, hasLocalIncomeTax: false },
    KS: { name: "Kansas", rate: 0.057, hasLocalIncomeTax: false },
    KY: { name: "Kentucky", rate: 0.05, hasLocalIncomeTax: true },
    LA: { name: "Louisiana", rate: 0.0425, hasLocalIncomeTax: false },
    ME: { name: "Maine", rate: 0.0715, hasLocalIncomeTax: false },
    MD: { name: "Maryland", rate: 0.0575, hasLocalIncomeTax: true },
    MA: { name: "Massachusetts", rate: 0.05, hasLocalIncomeTax: false },
    MI: { name: "Michigan", rate: 0.0425, hasLocalIncomeTax: true },
    MN: { name: "Minnesota", rate: 0.0985, hasLocalIncomeTax: false },
    MS: { name: "Mississippi", rate: 0.05, hasLocalIncomeTax: false },
    MO: { name: "Missouri", rate: 0.0504, hasLocalIncomeTax: true },
    MT: { name: "Montana", rate: 0.068, hasLocalIncomeTax: false },
    NE: { name: "Nebraska", rate: 0.0664, hasLocalIncomeTax: false },
    NV: { name: "Nevada", rate: 0.0, hasLocalIncomeTax: false },
    NH: { name: "New Hampshire", rate: 0.05, hasLocalIncomeTax: false },
    NJ: { name: "New Jersey", rate: 0.1075, hasLocalIncomeTax: false },
    NM: { name: "New Mexico", rate: 0.059, hasLocalIncomeTax: false },
    NY: { name: "New York", rate: 0.109, hasLocalIncomeTax: true },
    NC: { name: "North Carolina", rate: 0.0475, hasLocalIncomeTax: false },
    ND: { name: "North Dakota", rate: 0.029, hasLocalIncomeTax: false },
    OH: { name: "Ohio", rate: 0.0399, hasLocalIncomeTax: true },
    OK: { name: "Oklahoma", rate: 0.0475, hasLocalIncomeTax: false },
    OR: { name: "Oregon", rate: 0.099, hasLocalIncomeTax: true },
    PA: { name: "Pennsylvania", rate: 0.0307, hasLocalIncomeTax: true },
    RI: { name: "Rhode Island", rate: 0.0599, hasLocalIncomeTax: false },
    SC: { name: "South Carolina", rate: 0.07, hasLocalIncomeTax: false },
    SD: { name: "South Dakota", rate: 0.0, hasLocalIncomeTax: false },
    TN: { name: "Tennessee", rate: 0.0, hasLocalIncomeTax: false },
    TX: { name: "Texas", rate: 0.0, hasLocalIncomeTax: false },
    UT: { name: "Utah", rate: 0.0495, hasLocalIncomeTax: false },
    VT: { name: "Vermont", rate: 0.0875, hasLocalIncomeTax: false },
    VA: { name: "Virginia", rate: 0.0575, hasLocalIncomeTax: false },
    WA: { name: "Washington", rate: 0.0, hasLocalIncomeTax: false },
    WV: { name: "West Virginia", rate: 0.065, hasLocalIncomeTax: false },
    WI: { name: "Wisconsin", rate: 0.0765, hasLocalIncomeTax: false },
    WY: { name: "Wyoming", rate: 0.0, hasLocalIncomeTax: false },
    DC: {
      name: "District of Columbia",
      rate: 0.0995,
      hasLocalIncomeTax: false,
    },
  };

  // Approximate state spending breakdown (will be used for all states)
  const stateSpendingBreakdown = [
    { name: "Education (K-12 & Higher Ed)", percentage: 35 },
    { name: "Health & Human Services", percentage: 30 },
    { name: "Transportation", percentage: 8 },
    { name: "Corrections", percentage: 7 },
    { name: "General Government", percentage: 5 },
    { name: "Public Safety", percentage: 4 },
    { name: "Environment & Natural Resources", percentage: 3 },
    { name: "Other", percentage: 8 },
  ];

  // Local spending breakdown (approximate)
  const localSpendingBreakdown = [
    { name: "Education", percentage: 40 },
    { name: "Public Safety", percentage: 20 },
    { name: "Transportation & Infrastructure", percentage: 15 },
    { name: "Parks & Recreation", percentage: 8 },
    { name: "Health Services", percentage: 7 },
    { name: "Administration", percentage: 5 },
    { name: "Other", percentage: 5 },
  ];

  // Get state from zip code (simplified)
  const getStateFromZip = (zip) => {
    if (!zip || zip.length !== 5) return null;

    const zipNum = parseInt(zip, 10);

    if (zipNum >= 99500 && zipNum <= 99999) return "AK";
    if (zipNum >= 35000 && zipNum <= 36999) return "AL";
    if (zipNum >= 71600 && zipNum <= 72999) return "AR";
    if (zipNum >= 85000 && zipNum <= 86999) return "AZ";
    if (zipNum >= 90000 && zipNum <= 96699) return "CA";
    if (zipNum >= 80000 && zipNum <= 81999) return "CO";
    if (zipNum >= 6000 && zipNum <= 6999) return "CT";
    if (zipNum >= 20000 && zipNum <= 20599) return "DC";
    if (zipNum >= 19700 && zipNum <= 19999) return "DE";
    if (zipNum >= 32000 && zipNum <= 34999) return "FL";
    if (zipNum >= 30000 && zipNum <= 31999) return "GA";
    if (zipNum >= 96700 && zipNum <= 96899) return "HI";
    if (zipNum >= 50000 && zipNum <= 52999) return "IA";
    if (zipNum >= 83200 && zipNum <= 83899) return "ID";
    if (zipNum >= 60000 && zipNum <= 62999) return "IL";
    if (zipNum >= 46000 && zipNum <= 47999) return "IN";
    if (zipNum >= 66000 && zipNum <= 67999) return "KS";
    if (zipNum >= 40000 && zipNum <= 42999) return "KY";
    if (zipNum >= 70000 && zipNum <= 71599) return "LA";
    if (zipNum >= 1000 && zipNum <= 2799) return "MA";
    if (zipNum >= 20600 && zipNum <= 21999) return "MD";
    if (zipNum >= 3900 && zipNum <= 4999) return "ME";
    if (zipNum >= 48000 && zipNum <= 49999) return "MI";
    if (zipNum >= 55000 && zipNum <= 56999) return "MN";
    if (zipNum >= 63000 && zipNum <= 65999) return "MO";
    if (zipNum >= 38600 && zipNum <= 39999) return "MS";
    if (zipNum >= 59000 && zipNum <= 59999) return "MT";
    if (zipNum >= 27000 && zipNum <= 28999) return "NC";
    if (zipNum >= 58000 && zipNum <= 58999) return "ND";
    if (zipNum >= 68000 && zipNum <= 69999) return "NE";
    if (zipNum >= 3000 && zipNum <= 3899) return "NH";
    if (zipNum >= 7000 && zipNum <= 8999) return "NJ";
    if (zipNum >= 87000 && zipNum <= 88499) return "NM";
    if (zipNum >= 89000 && zipNum <= 89899) return "NV";
    if (zipNum >= 10000 && zipNum <= 14999) return "NY";
    if (zipNum >= 43000 && zipNum <= 45999) return "OH";
    if (zipNum >= 73000 && zipNum <= 74999) return "OK";
    if (zipNum >= 97000 && zipNum <= 97999) return "OR";
    if (zipNum >= 15000 && zipNum <= 19699) return "PA";
    if (zipNum >= 2800 && zipNum <= 2999) return "RI";
    if (zipNum >= 29000 && zipNum <= 29999) return "SC";
    if (zipNum >= 57000 && zipNum <= 57999) return "SD";
    if (zipNum >= 37000 && zipNum <= 38599) return "TN";
    if (zipNum >= 75000 && zipNum <= 79999) return "TX";
    if (zipNum >= 84000 && zipNum <= 84999) return "UT";
    if (zipNum >= 22000 && zipNum <= 24699) return "VA";
    if (zipNum >= 5000 && zipNum <= 5999) return "VT";
    if (zipNum >= 98000 && zipNum <= 99499) return "WA";
    if (zipNum >= 53000 && zipNum <= 54999) return "WI";
    if (zipNum >= 24700 && zipNum <= 26999) return "WV";
    if (zipNum >= 82000 && zipNum <= 83199) return "WY";

    return null;
  };

  // Calculate federal tax (simplified)
  const calculateFederalTax = (income) => {
    let tax = 0;
    let remainingIncome = income;

    for (const bracket of federalTaxBrackets) {
      if (remainingIncome <= 0) break;

      const taxableInThisBracket = Math.min(
        bracket.max - bracket.min,
        remainingIncome
      );
      const taxInThisBracket = taxableInThisBracket * bracket.rate;

      tax += taxInThisBracket;
      remainingIncome -= taxableInThisBracket;
    }

    // Approximate Social Security and Medicare taxes
    const socialSecurityTax = Math.min(income, 168600) * 0.062; // 6.2% up to wage base limit
    const medicareTax = income * 0.0145; // 1.45% on all income

    // Add additional Medicare tax for high earners (0.9% over threshold)
    const additionalMedicareTax =
      income > 200000 ? (income - 200000) * 0.009 : 0;

    return {
      incomeTax: tax,
      socialSecurity: socialSecurityTax,
      medicare: medicareTax + additionalMedicareTax,
      total: tax + socialSecurityTax + medicareTax + additionalMedicareTax,
    };
  };

  // Calculate state tax (simplified)
  const calculateStateTax = (income, stateCode) => {
    if (!stateCode || !stateTaxData[stateCode]) {
      return { total: 0 };
    }

    const stateTaxRate = stateTaxData[stateCode].rate;
    const stateTax = income * stateTaxRate;

    return { total: stateTax };
  };

  // Calculate local tax (simplified approximation)
  const calculateLocalTax = (income, stateCode) => {
    if (
      !stateCode ||
      !stateTaxData[stateCode] ||
      !stateTaxData[stateCode].hasLocalIncomeTax
    ) {
      return { total: 0 };
    }

    // Very rough approximation - local tax rates vary widely
    const localTaxRate = 0.01; // 1% as a general approximation
    const localTax = income * localTaxRate;

    return { total: localTax };
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Prepare data for pie charts
  const prepareChartData = (breakdown, amount) => {
    return breakdown.map((item) => ({
      name: item.name,
      value: (item.percentage / 100) * amount,
      percentage: item.percentage,
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate inputs
    if (!zipCode || !income) {
      setError("Please enter both zip code and income.");
      setLoading(false);
      return;
    }

    // Parse income
    const incomeValue = parseFloat(income.replace(/[^0-9.]/g, ""));
    if (isNaN(incomeValue) || incomeValue <= 0) {
      setError("Please enter a valid income amount.");
      setLoading(false);
      return;
    }

    // Get state from zip code
    const stateCode = getStateFromZip(zipCode);
    if (!stateCode) {
      setError("Invalid or unsupported zip code.");
      setLoading(false);
      return;
    }

    // Set state info
    const stateObj = stateTaxData[stateCode];
    setStateInfo({
      code: stateCode,
      name: stateObj.name,
      hasLocalTax: stateObj.hasLocalIncomeTax,
    });

    // Calculate taxes
    const federalTax = calculateFederalTax(incomeValue);
    const stateTax = calculateStateTax(incomeValue, stateCode);
    const localTax = calculateLocalTax(incomeValue, stateCode);

    // Calculate total tax
    const totalTax = federalTax.total + stateTax.total + localTax.total;

    // Prepare results
    const taxResults = {
      income: incomeValue,
      federal: federalTax,
      state: stateTax,
      local: localTax,
      total: totalTax,
      federalBreakdown: prepareChartData(
        federalSpendingBreakdown,
        federalTax.total
      ),
      stateBreakdown: prepareChartData(stateSpendingBreakdown, stateTax.total),
      localBreakdown: prepareChartData(localSpendingBreakdown, localTax.total),
    };

    setResults(taxResults);
    setLoading(false);
  };

  // Card wrapper component
  const Card = ({ title, children, className = "" }) => (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden mb-6 ${className}`}
    >
      {title && (
        <div className="bg-gray-50 px-4 py-3 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );

  return (
    <div className="mx-auto p-4 max-w-6xl">
      <Card title="Tax Allocation Calculator">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="zipCode"
                className="block text-sm font-medium mb-1"
              >
                Zip Code
              </label>
              <input
                type="text"
                id="zipCode"
                className="w-full p-2 border rounded"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value.slice(0, 5))}
                maxLength={5}
                placeholder="Enter 5-digit zip code"
              />
            </div>
            <div>
              <label
                htmlFor="income"
                className="block text-sm font-medium mb-1"
              >
                Annual Income
              </label>
              <input
                type="text"
                id="income"
                className="w-full p-2 border rounded"
                value={income}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, "");
                  setIncome(val);
                }}
                placeholder="Enter annual income"
              />
            </div>
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <div className="flex justify-center mt-4">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded"
              disabled={loading}
            >
              {loading ? "Calculating..." : "Calculate"}
            </button>
          </div>
        </form>
      </Card>

      {results && (
        <>
          <Card title={`Tax Summary for ${stateInfo?.name}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Tax Breakdown</h3>
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="py-2">Annual Income:</td>
                      <td className="py-2 text-right font-medium">
                        {formatCurrency(results.income)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2">Federal Taxes:</td>
                      <td className="py-2 text-right font-medium">
                        {formatCurrency(results.federal.total)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 pl-4 text-sm">- Income Tax:</td>
                      <td className="py-2 text-right text-sm">
                        {formatCurrency(results.federal.incomeTax)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 pl-4 text-sm">- Social Security:</td>
                      <td className="py-2 text-right text-sm">
                        {formatCurrency(results.federal.socialSecurity)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 pl-4 text-sm">- Medicare:</td>
                      <td className="py-2 text-right text-sm">
                        {formatCurrency(results.federal.medicare)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2">State Taxes:</td>
                      <td className="py-2 text-right font-medium">
                        {formatCurrency(results.state.total)}
                      </td>
                    </tr>
                    {stateInfo?.hasLocalTax && (
                      <tr>
                        <td className="py-2">Local Taxes:</td>
                        <td className="py-2 text-right font-medium">
                          {formatCurrency(results.local.total)}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t">
                      <td className="py-2 font-bold">Total Taxes:</td>
                      <td className="py-2 text-right font-bold">
                        {formatCurrency(results.total)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2">Effective Tax Rate:</td>
                      <td className="py-2 text-right font-medium">
                        {((results.total / results.income) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Where Your Money Goes
                </h3>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                    <span>
                      Federal (
                      {Math.round(
                        (results.federal.total / results.total) * 100
                      )}
                      %)
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                    <span>
                      State (
                      {Math.round((results.state.total / results.total) * 100)}
                      %)
                    </span>
                  </div>
                  {stateInfo?.hasLocalTax && (
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-6 h-6 bg-amber-500 rounded-full"></div>
                      <span>
                        Local (
                        {Math.round(
                          (results.local.total / results.total) * 100
                        )}
                        %)
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-6" style={{ height: "250px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Federal", value: results.federal.total },
                          { name: "State", value: results.state.total },
                          { name: "Local", value: results.local.total },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        <Cell fill="#3b82f6" />
                        <Cell fill="#22c55e" />
                        <Cell fill="#f59e0b" />
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="Federal Tax Allocation">
              <div style={{ height: "200px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={results.federalBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      dataKey="value"
                    >
                      {results.federalBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-federal-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name, props) => [
                        `${formatCurrency(value)} (${
                          props.payload.percentage
                        }%)`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 max-h-40 overflow-y-auto">
                {results.federalBreakdown.map((item, index) => (
                  <div
                    key={`federal-legend-${index}`}
                    className="flex items-center mb-1"
                  >
                    <div
                      className="w-3 h-3 mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <div className="text-xs">
                      {item.name}: {formatCurrency(item.value)} (
                      {item.percentage}%)
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="State Tax Allocation">
              {results.state.total > 0 ? (
                <>
                  <div style={{ height: "200px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={results.stateBreakdown}
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          dataKey="value"
                        >
                          {results.stateBreakdown.map((entry, index) => (
                            <Cell
                              key={`cell-state-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name, props) => [
                            `${formatCurrency(value)} (${
                              props.payload.percentage
                            }%)`,
                            name,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 max-h-40 overflow-y-auto">
                    {results.stateBreakdown.map((item, index) => (
                      <div
                        key={`state-legend-${index}`}
                        className="flex items-center mb-1"
                      >
                        <div
                          className="w-3 h-3 mr-2"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        ></div>
                        <div className="text-xs">
                          {item.name}: {formatCurrency(item.value)} (
                          {item.percentage}%)
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-center text-gray-500">
                    No state income tax in {stateInfo?.name}
                  </p>
                </div>
              )}
            </Card>

            <Card title="Local Tax Allocation">
              {results.local.total > 0 ? (
                <>
                  <div style={{ height: "200px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={results.localBreakdown}
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          dataKey="value"
                        >
                          {results.localBreakdown.map((entry, index) => (
                            <Cell
                              key={`cell-local-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name, props) => [
                            `${formatCurrency(value)} (${
                              props.payload.percentage
                            }%)`,
                            name,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 max-h-40 overflow-y-auto">
                    {results.localBreakdown.map((item, index) => (
                      <div
                        key={`local-legend-${index}`}
                        className="flex items-center mb-1"
                      >
                        <div
                          className="w-3 h-3 mr-2"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        ></div>
                        <div className="text-xs">
                          {item.name}: {formatCurrency(item.value)} (
                          {item.percentage}%)
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-center text-gray-500">
                    No local income tax data available
                  </p>
                </div>
              )}
            </Card>
          </div>

          <Card title="Data Sources">
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                <strong>Federal Tax Brackets:</strong>
                <a
                  href="https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline ml-1"
                >
                  IRS Tax Inflation Adjustments 2024
                </a>
              </li>
              <li>
                <strong>Federal Budget Allocation:</strong>
                <a
                  href="https://www.cbo.gov/topics/budget"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline ml-1"
                >
                  Congressional Budget Office
                </a>
              </li>
              <li>
                <strong>State Tax Rates:</strong>
                <a
                  href="https://taxfoundation.org/data/all/state/state-individual-income-tax-rates-and-brackets/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline ml-1"
                >
                  Tax Foundation - State Individual Income Tax Rates
                </a>
              </li>
              <li>
                <strong>State Budget Allocation:</strong>
                <a
                  href="https://www.nasbo.org/reports-data/state-expenditure-report"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline ml-1"
                >
                  National Association of State Budget Officers
                </a>
              </li>
              <li>
                <strong>Local Government Finance:</strong>
                <a
                  href="https://www.census.gov/programs-surveys/gov-finances.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline ml-1"
                >
                  U.S. Census Bureau - Government Finance Statistics
                </a>
              </li>
            </ul>
            <p className="mt-4 text-sm text-gray-600">
              <strong>Note:</strong> This calculator provides estimates based on
              simplified tax models. Actual tax calculations may vary based on
              filing status, deductions, credits, and other factors. For
              accurate tax advice, please consult a tax professional.
            </p>
          </Card>
        </>
      )}
    </div>
  );
};

export default TaxCalculator;
