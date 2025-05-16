import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const LeaveForecasting = ({ leaveBalance }) => {
  const [forecastMonths, setForecastMonths] = useState(6);
  const [plannedLeaves, setPlannedLeaves] = useState([]);
  const [forecastData, setForecastData] = useState(null);

  // Add a new planned leave
  const addPlannedLeave = () => {
    setPlannedLeaves([
      ...plannedLeaves,
      {
        id: Date.now(),
        month: new Date().getMonth(),
        days: 1,
        type: 'annual'
      }
    ]);
  };

  // Remove a planned leave
  const removePlannedLeave = (id) => {
    setPlannedLeaves(plannedLeaves.filter(leave => leave.id !== id));
  };

  // Update a planned leave
  const updatePlannedLeave = (id, field, value) => {
    setPlannedLeaves(plannedLeaves.map(leave => 
      leave.id === id ? { ...leave, [field]: value } : leave
    ));
  };

  // Calculate forecast data
  useEffect(() => {
    if (!leaveBalance) return;

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Get current month and next N months
    const currentMonth = new Date().getMonth();
    const forecastLabels = [];
    for (let i = 0; i < forecastMonths; i++) {
      const monthIndex = (currentMonth + i) % 12;
      forecastLabels.push(months[monthIndex]);
    }

    // Initialize forecast with current balance
    const annualForecast = Array(forecastMonths).fill(leaveBalance.annual || 0);
    const sickForecast = Array(forecastMonths).fill(leaveBalance.sick || 0);
    const personalForecast = Array(forecastMonths).fill(leaveBalance.personal || 0);

    // Accrual rates per month (example values)
    const annualAccrual = 1.5; // 18 days per year
    const sickAccrual = 0.5; // 6 days per year
    const personalAccrual = 0.25; // 3 days per year

    // Apply accruals
    for (let i = 1; i < forecastMonths; i++) {
      annualForecast[i] = annualForecast[i-1] + annualAccrual;
      sickForecast[i] = sickForecast[i-1] + sickAccrual;
      personalForecast[i] = personalForecast[i-1] + personalAccrual;
    }

    // Apply planned leaves
    plannedLeaves.forEach(leave => {
      const monthIndex = leave.month - currentMonth;
      if (monthIndex >= 0 && monthIndex < forecastMonths) {
        switch (leave.type) {
          case 'annual':
            for (let i = monthIndex; i < forecastMonths; i++) {
              annualForecast[i] -= leave.days;
            }
            break;
          case 'sick':
            for (let i = monthIndex; i < forecastMonths; i++) {
              sickForecast[i] -= leave.days;
            }
            break;
          case 'personal':
            for (let i = monthIndex; i < forecastMonths; i++) {
              personalForecast[i] -= leave.days;
            }
            break;
          default:
            break;
        }
      }
    });

    // Prepare chart data
    setForecastData({
      labels: forecastLabels,
      datasets: [
        {
          label: 'Annual Leave',
          data: annualForecast,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.1
        },
        {
          label: 'Sick Leave',
          data: sickForecast,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1
        },
        {
          label: 'Personal Leave',
          data: personalForecast,
          borderColor: 'rgba(255, 206, 86, 1)',
          backgroundColor: 'rgba(255, 206, 86, 0.2)',
          tension: 0.1
        }
      ]
    });
  }, [leaveBalance, forecastMonths, plannedLeaves]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Leave Balance Forecast',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw.toFixed(1)} days`;
          }
        }
      }
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Days'
        },
        min: 0
      }
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Leave Balance Forecasting</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Forecast Period (months)
        </label>
        <select
          value={forecastMonths}
          onChange={(e) => setForecastMonths(parseInt(e.target.value))}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="3">3 months</option>
          <option value="6">6 months</option>
          <option value="9">9 months</option>
          <option value="12">12 months</option>
        </select>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Planned Leaves</h3>
          <button
            onClick={addPlannedLeave}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Add Leave
          </button>
        </div>
        
        {plannedLeaves.length === 0 ? (
          <p className="text-gray-500 text-sm">No planned leaves added yet.</p>
        ) : (
          <div className="space-y-3">
            {plannedLeaves.map((leave) => (
              <div key={leave.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                <select
                  value={leave.month}
                  onChange={(e) => updatePlannedLeave(leave.id, 'month', parseInt(e.target.value))}
                  className="block w-32 pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="0">January</option>
                  <option value="1">February</option>
                  <option value="2">March</option>
                  <option value="3">April</option>
                  <option value="4">May</option>
                  <option value="5">June</option>
                  <option value="6">July</option>
                  <option value="7">August</option>
                  <option value="8">September</option>
                  <option value="9">October</option>
                  <option value="10">November</option>
                  <option value="11">December</option>
                </select>
                
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={leave.days}
                  onChange={(e) => updatePlannedLeave(leave.id, 'days', parseInt(e.target.value))}
                  className="block w-20 pl-3 pr-3 py-1 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                />
                
                <select
                  value={leave.type}
                  onChange={(e) => updatePlannedLeave(leave.id, 'type', e.target.value)}
                  className="block w-32 pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="annual">Annual</option>
                  <option value="sick">Sick</option>
                  <option value="personal">Personal</option>
                </select>
                
                <button
                  onClick={() => removePlannedLeave(leave.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-4">Forecast Chart</h3>
        {forecastData ? (
          <Line data={forecastData} options={chartOptions} />
        ) : (
          <div className="flex justify-center items-center h-60 bg-gray-50 rounded">
            <p className="text-gray-500">No forecast data available</p>
          </div>
        )}
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        <p>* This forecast is based on your current leave balance and assumes standard accrual rates.</p>
        <p>* Actual leave balance may vary based on company policy and other factors.</p>
      </div>
    </div>
  );
};

export default LeaveForecasting;