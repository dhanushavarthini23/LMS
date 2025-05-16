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
      title: 'Compassionate Leave',
      summary: 'Leave entitlements for bereavement and family emergencies.',
      content: `
        <h3>Compassionate Leave Policy</h3>
        <p>Employees are entitled to up to 5 days of paid compassionate leave per year in the event of death or serious illness of an immediate family member.</p>
        <p>Immediate family members include spouse, children, parents, siblings, grandparents, and in-laws.</p>
        <h4>Requesting Compassionate Leave:</h4>
        <ol>
          <li>Notify your manager as soon as possible</li>
          <li>Submit a compassionate leave request through the system</li>
          <li>Provide supporting documentation if requested</li>
        </ol>
        <p>Additional unpaid leave may be granted in exceptional circumstances at management's discretion.</p>
      `
    },
    {
      id: 5,
      title: 'Study Leave',
      summary: 'Leave options for professional development and education.',
      content: `
        <h3>Study Leave Policy</h3>
        <p>Employees pursuing job-related education may be eligible for up to 10 days of paid study leave per year.</p>
        <p>Study leave can be used for exam preparation, attending classes, or completing assignments.</p>
        <h4>Eligibility Criteria:</h4>
        <ul>
          <li>Course of study must be relevant to the employee's current role or career path within the company</li>
          <li>Employee must have completed at least 6 months of continuous service</li>
          <li>Academic performance must be satisfactory</li>
          <li>Business needs must allow for the absence</li>
        </ul>
        <p>Study leave requests should be submitted at least 4 weeks in advance with course details and schedule.</p>
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
