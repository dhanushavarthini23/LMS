import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import LeaveForm from '../components/LeaveForm';
import LeaveHistory from '../components/LeaveHistory';
import LeaveCalendar from '../components/LeaveCalendar';
import LeavePolicies from '../components/LeavePolicies';
import DashboardCharts from '../components/DashboardCharts';
import LeaveForecasting from '../components/LeaveForecasting';
import { AuthContext } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { getDashboardData, getLeaveBalance } from '../api/api';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { authData, logout } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userName, setUserName] = useState('');
 
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const dashboardResponse = await getDashboardData();
      const rawData = dashboardResponse.data;
      const leaveRequests = rawData.leaveRequests || [];
      const leaveTypeCount = {
        annual: 0,
        sick: 0,
        personal: 0,
        other: 0
      };
      
      leaveRequests.forEach(leave => {
        const type = (leave.leaveType?.name || leave.leaveType || '').toLowerCase();
        if (type.includes('annual') || type.includes('vacation')) {
          leaveTypeCount.annual += 1;
        } else if (type.includes('sick')) {
          leaveTypeCount.sick += 1;
        } else if (type.includes('personal')) {
          leaveTypeCount.personal += 1;
        } else {
          leaveTypeCount.other += 1;
        }
      });
      const monthlyData = Array(12).fill(0);
      leaveRequests.forEach(leave => {
        if (leave.startDate) {
          const month = new Date(leave.startDate).getMonth();
          monthlyData[month] += 1;
        }
      });
      const enhancedData = {
        ...rawData,
        leaveTypeDistribution: leaveTypeCount,
        monthlyTrends: monthlyData
      };
      
      setDashboardData(enhancedData);
      
      // Fetch leave balance
      const balanceResponse = await getLeaveBalance();
      console.log('Leave balance response:', balanceResponse.data);
      // Handle both old format (number) and new format (object)
      const balance = balanceResponse.data.leaveBalance;
      if (typeof balance === 'object' && balance !== null && balance.balances) {
        // New comprehensive format
        setLeaveBalance(balance);
      } else if (typeof balance === 'object' && balance !== null) {
        // Old object format
        setLeaveBalance(balance);
      } else {
        // Fallback for very old format (just a number)
        setLeaveBalance({
          annual: balance || 20,
          sick: 10,
          personal: 5,
          totalTaken: 0,
          totalEntitlement: 35
        });
      }
      
      setError('');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authData?.token) {
      try {
        const decoded = jwtDecode(authData.token);
        console.log('Decoded token:', decoded); 
        setUserName(decoded.name || decoded.username || 'Employee');
      } catch (error) {
        console.error('Error decoding token:', error);
        setUserName('Employee');
      }
      
      fetchDashboardData();
    }
  }, [authData]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLeaveRequestSuccess = () => {
    setShowLeaveForm(false);
    
    fetchDashboardData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                <svg className="w-10 h-10 mr-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Employee Dashboard
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Welcome back, <span className="font-semibold text-indigo-600">{userName}</span></p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-2 mb-8 shadow-lg border border-white/20">
          <nav className="flex space-x-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-white/50'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-6 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === 'calendar'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-white/50'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Leave Calendar
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-white/50'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Leave History
            </button>
            <button
              onClick={() => setActiveTab('policies')}
              className={`px-6 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === 'policies'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-white/50'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Leave Policies
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-white/50'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('forecasting')}
              className={`px-6 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === 'forecasting'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-white/50'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Leave Forecasting
            </button>
          </nav>
        </div>

      {loading && activeTab === 'dashboard' ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : error && activeTab === 'dashboard' ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      ) : (
        <>
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <>
              {/* Dashboard Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Leave Balance Card */}
                <div className="bg-white p-4 rounded shadow">
                  <h2 className="text-lg font-semibold mb-2">Leave Balance</h2>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {leaveBalance?.balances ? (
                      Object.entries(leaveBalance.balances).map(([leaveType, balance]) => (
                        <div key={leaveType} className="flex justify-between">
                          <span className="text-sm">{leaveType}:</span>
                          <span className="font-bold text-sm">
                            {balance.remaining === 'N/A' ? 'Case by case' : `${balance.remaining} days`}
                          </span>
                        </div>
                      ))
                    ) : (
                      // Fallback for old format
                      <>
                        <div className="flex justify-between">
                          <span>Annual Leave:</span>
                          <span className="font-bold">{leaveBalance?.annual || 20} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sick Leave:</span>
                          <span className="font-bold">{leaveBalance?.sick || 10} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Personal Leave:</span>
                          <span className="font-bold">{leaveBalance?.personal || 5} days</span>
                        </div>
                      </>
                    )}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total Taken:</span>
                        <span>{leaveBalance?.totalTaken || 0} days</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pending Requests Card */}
                <div className="bg-white p-4 rounded shadow">
                  <h2 className="text-lg font-semibold mb-2">Pending Requests</h2>
                  {(dashboardData?.leaveRequests || []).filter(req => req.status === 'Pending').length > 0 ? (
                    <div className="text-yellow-500 font-bold text-2xl">
                      {(dashboardData?.leaveRequests || []).filter(req => req.status === 'Pending').length}
                    </div>
                  ) : (
                    <div className="text-gray-500">No pending requests</div>
                  )}
                </div>

                {/* Approved Requests Card */}
                <div className="bg-white p-4 rounded shadow">
                  <h2 className="text-lg font-semibold mb-2">Approved Requests</h2>
                  {(dashboardData?.leaveRequests || []).filter(req => req.status === 'Approved').length > 0 ? (
                    <div className="text-green-500 font-bold text-2xl">
                      {(dashboardData?.leaveRequests || []).filter(req => req.status === 'Approved').length}
                    </div>
                  ) : (
                    <div className="text-gray-500">No approved requests</div>
                  )}
                </div>
              </div>

              {/* Leave Request Button */}
              <div className="mb-6">
                <button
                  onClick={() => setShowLeaveForm(!showLeaveForm)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                  {showLeaveForm ? 'Cancel Request' : 'New Leave Request'}
                </button>
              </div>

              {/* Leave Request Form */}
              {showLeaveForm && (
                <div className="mb-6">
                  <LeaveForm onSuccess={handleLeaveRequestSuccess} />
                </div>
              )}

              {/* Recent Leave Requests */}
              <div className="mt-8 bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Recent Leave Requests</h2>
                <LeaveHistory limit={5} onLeaveUpdate={fetchDashboardData} />
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setActiveTab('history')}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    View All Leave History
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && <LeaveCalendar />}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="bg-white shadow rounded-lg p-6">
              
              <LeaveHistory onLeaveUpdate={fetchDashboardData} />
            </div>
          )}

          {/* Policies Tab */}
          {activeTab === 'policies' && <LeavePolicies />}
          
          {/* Analytics Tab */}
          {activeTab === 'analytics' && <DashboardCharts dashboardData={dashboardData} />}
          
          {/* Forecasting Tab */}
          {activeTab === 'forecasting' && <LeaveForecasting leaveBalance={leaveBalance} />}
        </>
      )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
