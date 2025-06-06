import React, { useState } from 'react';
import DOMPurify from 'dompurify';

const LeavePolicies = () => {
  const [expandedPolicy, setExpandedPolicy] = useState(null);

  const policies = [
    {
      id: 1,
      title: 'Annual Leave Policy',
      summary: 'Guidelines for requesting and using annual leave.',
      content: `
        <h3>Annual Leave Policy</h3>
        <p>All full-time employees are entitled to 20 days of annual leave per year, accrued at a rate of 1.67 days per month.</p>
        <p>Annual leave requests should be submitted at least 2 weeks in advance for approval.</p>
        <p>Unused annual leave can be carried forward to the next year, up to a maximum of 5 days.</p>
        <h4>Approval Process:</h4>
        <ol>
          <li>Employee submits leave request through the system</li>
          <li>Manager reviews and approves/rejects the request</li>
          <li>HR department confirms the approval</li>
          <li>Employee receives notification of the decision</li>
        </ol>
        <p>During peak business periods, management reserves the right to limit the number of employees on leave simultaneously.</p>
      `
    },
    {
      id: 2,
      title: 'Sick Leave Policy',
      summary: 'Information about sick leave entitlements and procedures.',
      content: `
        <h3>Sick Leave Policy</h3>
        <p>Employees are entitled to 10 days of paid sick leave per year.</p>
        <p>For sick leave exceeding 3 consecutive days, a medical certificate is required.</p>
        <p>Sick leave should be reported as soon as possible, preferably before the start of the working day.</p>
        <h4>Reporting Procedure:</h4>
        <ol>
          <li>Notify your manager via phone or email</li>
          <li>Submit a sick leave request through the system</li>
          <li>Provide medical documentation if required</li>
          <li>Update your manager on expected return date</li>
        </ol>
        <p>Unused sick leave does not carry over to the next year and is not paid out upon termination.</p>
      `
    },
    {
      id: 3,
      title: 'Maternity & Paternity Leave',
      summary: 'Details about parental leave entitlements.',
      content: `
        <h3>Maternity & Paternity Leave Policy</h3>
        <p>Maternity Leave: Female employees are entitled to 12 weeks of paid maternity leave.</p>
        <p>Paternity Leave: Male employees are entitled to 2 weeks of paid paternity leave.</p>
        <p>Additional unpaid leave may be granted upon request and management approval.</p>
        <h4>Eligibility:</h4>
        <ul>
          <li>Employee must have completed at least 12 months of continuous service</li>
          <li>Notice should be given at least 3 months before the expected date of birth</li>
          <li>Medical documentation must be provided</li>
        </ul>
        <p>Employees on maternity or paternity leave continue to accrue annual leave entitlements.</p>
      `
    },
    {
      id: 4,
      title: 'Personal Leave',
      summary: 'Personal leave entitlements for personal matters.',
      content: `
        <h3>Personal Leave Policy</h3>
        <p>Employees are entitled to 5 days of paid personal leave per year for personal matters that cannot be scheduled outside of work hours.</p>
        <p>Personal leave can be used for appointments, family matters, or other personal obligations.</p>
        <h4>Requesting Personal Leave:</h4>
        <ol>
          <li>Submit personal leave request through the system</li>
          <li>Provide at least 24 hours notice when possible</li>
          <li>Manager approval is required</li>
        </ol>
        <p>Personal leave cannot be carried forward to the next year.</p>
      `
    },
    {
      id: 5,
      title: 'Emergency Leave',
      summary: 'Leave for emergency situations requiring immediate time off.',
      content: `
        <h3>Emergency Leave Policy</h3>
        <p>Employees are entitled to up to 3 days of paid emergency leave per year for unexpected situations requiring immediate time off.</p>
        <p>Emergency leave covers situations such as family emergencies, natural disasters, or other unforeseen circumstances.</p>
        <h4>Requesting Emergency Leave:</h4>
        <ol>
          <li>Notify your manager as soon as possible</li>
          <li>Submit an emergency leave request through the system</li>
          <li>Provide supporting documentation when available</li>
        </ol>
        <p>Additional unpaid leave may be granted in exceptional circumstances at management's discretion.</p>
      `
    },
    {
      id: 6,
      title: 'Other Leave Types',
      summary: 'Special leave types handled on a case-by-case basis.',
      content: `
        <h3>Other Leave Types Policy</h3>
        <p>For special circumstances not covered by standard leave categories, employees may request other types of leave.</p>
        <p>These requests are evaluated on a case-by-case basis and may include:</p>
        <ul>
          <li>Study leave for professional development</li>
          <li>Sabbatical leave for long-term projects</li>
          <li>Volunteer leave for community service</li>
          <li>Religious or cultural observance leave</li>
          <li>Extended medical leave beyond sick leave entitlement</li>
        </ul>
        <h4>Application Process:</h4>
        <ol>
          <li>Submit a detailed request explaining the nature and duration of leave needed</li>
          <li>Provide supporting documentation where applicable</li>
          <li>Allow sufficient time for review and approval process</li>
          <li>Discuss coverage arrangements for your responsibilities</li>
        </ol>
        <p>Approval is at management's discretion and depends on business needs and individual circumstances.</p>
      `
    }
  ];

  const togglePolicy = (id) => {
    setExpandedPolicy((prev) => (prev === id ? null : id));
  };

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Leave Policies</h2>

      <div className="space-y-4">
        {policies.map((policy) => (
          <div key={policy.id} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => togglePolicy(policy.id)}
              className="w-full flex justify-between items-start p-4 text-left bg-gray-100 hover:bg-gray-200 transition"
            >
              <div className="flex flex-col">
                <h3 className="font-semibold text-lg">{policy.title}</h3>
                {expandedPolicy !== policy.id && (
                  <p className="text-sm text-gray-600 mt-1">{policy.summary}</p>
                )}
              </div>
              <svg
                className={`w-5 h-5 mt-1 transform transition-transform duration-300 ${
                  expandedPolicy === policy.id ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedPolicy === policy.id && (
              <div className="p-4 prose prose-sm max-w-none bg-white">
                <div
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(policy.content),
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeavePolicies;
