import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const DashboardCharts = ({ dashboardData }) => {
  
  const data = dashboardData || {
    leaveTypeDistribution: { annual: 10, sick: 5, personal: 3, other: 2 },
    monthlyTrends: Array(12).fill(0).map(() => Math.floor(Math.random() * 5))
  };
  
  
  const leaveTypeData = {
    labels: ['Annual', 'Sick', 'Personal', 'Other'],
    datasets: [
      {
        label: 'Leave Distribution',
        data: [
          data.leaveTypeDistribution?.annual || 0,
          data.leaveTypeDistribution?.sick || 0,
          data.leaveTypeDistribution?.personal || 0,
          data.leaveTypeDistribution?.other || 0,
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for monthly leave trends
  const currentYear = new Date().getFullYear();
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  
  const monthlyData = {
    labels: months,
    datasets: [
      {
        label: 'Leave Days Taken',
        data: data.monthlyTrends || Array(12).fill(0).map(() => Math.floor(Math.random() * 5)),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for leave status distribution
  const statusData = {
    labels: ['Approved', 'Pending', 'Rejected'],
    datasets: [
      {
        label: 'Leave Status',
        data: [
          (data.leaveRequests || []).filter(req => req.status === 'Approved').length || 3,
          (data.leaveRequests || []).filter(req => req.status === 'Pending').length || 2,
          (data.leaveRequests || []).filter(req => req.status === 'Rejected').length || 1,
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Monthly Leave Trends (${currentYear})`,
      },
    },
  };

  // for pie charts
  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-lg font-semibold mb-4">Leave Type Distribution</h3>
        <Pie data={leaveTypeData} options={pieOptions} />
      </div>
      
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-lg font-semibold mb-4">Leave Status Distribution</h3>
        <Pie data={statusData} options={pieOptions} />
      </div>
      
      <div className="bg-white p-4 rounded shadow md:col-span-2">
        <h3 className="text-lg font-semibold mb-4">Monthly Leave Trends</h3>
        <Bar data={monthlyData} options={barOptions} />
      </div>
    </div>
  );
};

export default DashboardCharts;