# Leave Management System Frontend

This is the frontend for the Leave Management System built with React, JavaScript, and Tailwind CSS.

## Features

- User authentication (login/logout)
- Dashboard with overview of leave requests and approvals
- Create and manage leave requests
- Approval workflows for managers and HR
- Employee management for HR users
- Responsive design with Tailwind CSS

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend API running on http://localhost:5000

## Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```
   cd frontend
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Running the Application

1. Start the development server:
   ```
   npm run dev
   ```
2. Open your browser and navigate to the URL shown in the terminal (typically http://localhost:5173)

## Project Structure

- `/src/api` - API service for backend communication
- `/src/components` - Reusable UI components
- `/src/context` - React context for state management
- `/src/layouts` - Page layout components
- `/src/pages` - Page components
- `/src/utils` - Utility functions

## User Roles

The application supports three user roles:

1. **Employee**
   - Can create and view their own leave requests
   - Can view their leave balance

2. **Manager**
   - Can approve/reject leave requests from their team members
   - Can view pending approvals
   - Has all Employee permissions

3. **HR**
   - Can manage employees (add, view)
   - Can approve/reject leave requests after manager approval
   - Has all Manager permissions

## Technologies Used

- React + Vite
- React Router
- Axios
- Tailwind CSS
- Heroicons
- Headless UI
