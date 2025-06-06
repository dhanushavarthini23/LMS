import React, { useState } from 'react';

const SystemSettings = ({ systemStats, onSettingsUpdate }) => {
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState({
    // General Settings
    companyName: 'Your Company',
    workingDaysPerWeek: 5,
    weekendDays: ['Saturday', 'Sunday'],
    fiscalYearStart: 'January',
    
    // Leave Settings
    maxBackdatedDays: 14,
    carryForwardDeadline: 'March 31',
    autoApprovalThreshold: 0,
    
    // Notification Settings
    emailNotifications: true,
    reminderDays: 7,
    escalationDays: 3,
    
    // Security Settings
    passwordMinLength: 8,
    sessionTimeout: 30,
    maxLoginAttempts: 5
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = () => {
    // Here you would typically save to backend
    console.log('Saving settings:', settings);
    onSettingsUpdate();
  };

  const sections = [
    { id: 'general', name: 'General', icon: '⚙️' },
    { id: 'leave', name: 'Leave Policies', icon: '📋' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'backup', name: 'Backup & Maintenance', icon: '💾' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
        <button
          onClick={handleSaveSettings}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Save All Settings
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">Settings Categories</h3>
            <nav className="space-y-2">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{section.icon}</span>
                  {section.name}
                </button>
              ))}
            </nav>
          </div>

          {/* System Stats */}
          <div className="bg-white rounded-lg shadow p-4 mt-4">
            <h3 className="text-lg font-semibold mb-4">System Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Employees:</span>
                <span className="font-medium">{systemStats?.totalEmployees || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Employees:</span>
                <span className="font-medium text-green-600">{systemStats?.activeEmployees || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Departments:</span>
                <span className="font-medium">{systemStats?.totalDepartments || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Leave Types:</span>
                <span className="font-medium">{systemStats?.totalLeaveTypes || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow p-6">
            {/* General Settings */}
            {activeSection === 'general' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">General Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={settings.companyName}
                      onChange={(e) => handleSettingChange('companyName', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Working Days Per Week</label>
                    <select
                      value={settings.workingDaysPerWeek}
                      onChange={(e) => handleSettingChange('workingDaysPerWeek', parseInt(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={5}>5 Days</option>
                      <option value={6}>6 Days</option>
                      <option value={7}>7 Days</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal Year Start</label>
                    <select
                      value={settings.fiscalYearStart}
                      onChange={(e) => handleSettingChange('fiscalYearStart', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="January">January</option>
                      <option value="April">April</option>
                      <option value="July">July</option>
                      <option value="October">October</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Leave Policy Settings */}
            {activeSection === 'leave' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Leave Policy Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Backdated Days</label>
                    <input
                      type="number"
                      value={settings.maxBackdatedDays}
                      onChange={(e) => handleSettingChange('maxBackdatedDays', parseInt(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum days employees can apply for backdated sick leave</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Carry Forward Deadline</label>
                    <input
                      type="text"
                      value={settings.carryForwardDeadline}
                      onChange={(e) => handleSettingChange('carryForwardDeadline', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Deadline for using carried forward leave</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Auto-Approval Threshold (days)</label>
                    <input
                      type="number"
                      value={settings.autoApprovalThreshold}
                      onChange={(e) => handleSettingChange('autoApprovalThreshold', parseInt(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave requests below this threshold are auto-approved (0 = disabled)</p>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeSection === 'notifications' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">Enable Email Notifications</label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reminder Days</label>
                      <input
                        type="number"
                        value={settings.reminderDays}
                        onChange={(e) => handleSettingChange('reminderDays', parseInt(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Days before leave starts to send reminder</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Escalation Days</label>
                      <input
                        type="number"
                        value={settings.escalationDays}
                        onChange={(e) => handleSettingChange('escalationDays', parseInt(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Days to escalate pending approvals</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeSection === 'security' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password Minimum Length</label>
                    <input
                      type="number"
                      value={settings.passwordMinLength}
                      onChange={(e) => handleSettingChange('passwordMinLength', parseInt(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Login Attempts</label>
                    <input
                      type="number"
                      value={settings.maxLoginAttempts}
                      onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Backup & Maintenance */}
            {activeSection === 'backup' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Backup & Maintenance</h3>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Database Backup</h4>
                    <p className="text-sm text-blue-700 mb-3">Create a backup of all system data</p>
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                      Create Backup
                    </button>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">System Maintenance</h4>
                    <p className="text-sm text-green-700 mb-3">Clean up old logs and optimize database</p>
                    <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
                      Run Maintenance
                    </button>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">Export Data</h4>
                    <p className="text-sm text-yellow-700 mb-3">Export employee and leave data to CSV</p>
                    <div className="space-x-2">
                      <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded">
                        Export Employees
                      </button>
                      <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded">
                        Export Leave Data
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;