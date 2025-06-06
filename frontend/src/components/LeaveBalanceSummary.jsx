import React from 'react';

const LeaveBalanceSummary = ({ leaveBalance, showDetails = false, compact = false }) => {
  if (!leaveBalance) {
    return (
      <div className="text-gray-500 text-sm">
        Loading leave balance...
      </div>
    );
  }

  // Handle new comprehensive format
  if (leaveBalance.balances) {
    return (
      <div className={`space-y-2 ${compact ? 'text-sm' : ''}`}>
        {Object.entries(leaveBalance.balances).map(([leaveType, balance]) => (
          <div key={leaveType} className={`flex justify-between ${compact ? 'py-1' : 'py-2'}`}>
            <div className="flex flex-col">
              <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>
                {leaveType}:
              </span>
              {showDetails && (
                <span className={`text-gray-600 ${compact ? 'text-xs' : 'text-xs'}`}>
                  Used: {balance.taken} | Total: {balance.entitlement}
                </span>
              )}
            </div>
            <span className={`font-bold text-blue-600 ${compact ? 'text-xs' : 'text-sm'}`}>
              {balance.remaining === 'N/A' ? 'Case by case' : `${balance.remaining} days`}
            </span>
          </div>
        ))}
        
        {showDetails && (
          <div className={`border-t pt-2 mt-2 ${compact ? 'text-xs' : 'text-sm'}`}>
            <div className="flex justify-between font-semibold">
              <span>Total Used:</span>
              <span className="text-red-600">{leaveBalance.totalTaken || 0} days</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total Available:</span>
              <span className="text-green-600">{leaveBalance.totalEntitlement || 0} days</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Handle legacy format
  return (
    <div className={`space-y-2 ${compact ? 'text-sm' : ''}`}>
      <div className={`flex justify-between ${compact ? 'py-1' : 'py-2'}`}>
        <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>Annual Leave:</span>
        <span className={`font-bold text-blue-600 ${compact ? 'text-xs' : 'text-sm'}`}>
          {leaveBalance.annual || 20} days
        </span>
      </div>
      <div className={`flex justify-between ${compact ? 'py-1' : 'py-2'}`}>
        <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>Sick Leave:</span>
        <span className={`font-bold text-blue-600 ${compact ? 'text-xs' : 'text-sm'}`}>
          {leaveBalance.sick || 10} days
        </span>
      </div>
      <div className={`flex justify-between ${compact ? 'py-1' : 'py-2'}`}>
        <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>Personal Leave:</span>
        <span className={`font-bold text-blue-600 ${compact ? 'text-xs' : 'text-sm'}`}>
          {leaveBalance.personal || 5} days
        </span>
      </div>
      
      {showDetails && (
        <div className={`border-t pt-2 mt-2 ${compact ? 'text-xs' : 'text-sm'}`}>
          <div className="flex justify-between font-semibold">
            <span>Total Used:</span>
            <span className="text-red-600">{leaveBalance.totalTaken || 0} days</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveBalanceSummary;