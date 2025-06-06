# Leave Management System

A comprehensive web-based leave management system built with React.js frontend and Node.js backend, designed to streamline employee leave requests and approval workflows.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [User Roles & Permissions](#user-roles--permissions)
- [Installation & Setup](#installation--setup)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Workflow Diagrams](#workflow-diagrams)
- [Security Features](#security-features)
- [Logging & Monitoring](#logging--monitoring)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🎯 Overview

The Leave Management System is designed to automate and streamline the process of requesting, approving, and tracking employee leave. It provides a user-friendly interface for employees to submit leave requests and enables managers and HR personnel to efficiently manage and approve these requests.

### Key Benefits
- **Automated Workflow**: Streamlined approval process with role-based routing
- **Real-time Tracking**: Live status updates for all leave requests
- **Balance Management**: Automatic leave balance calculations and updates
- **Audit Trail**: Complete history of all leave transactions
- **Multi-level Approval**: Manager and HR approval workflows
- **Dashboard Analytics**: Comprehensive reporting and statistics

## ✨ Features

### 🔐 Authentication & Authorization
- **JWT-based Authentication**: Secure token-based login system
- **Role-based Access Control**: Different permissions for Employee, Manager, HR, and Admin
- **Password Security**: Bcrypt hashing for secure password storage
- **Session Management**: Automatic token refresh and logout

### 👥 User Management
- **Employee Registration**: Admin can create new employee accounts
- **Profile Management**: Users can update their personal information
- **Role Assignment**: Flexible role-based system
- **Department Management**: Organize employees by departments
- **Manager Assignment**: Hierarchical reporting structure

### 📝 Leave Request Management
- **Multiple Leave Types**: Annual, Sick, Personal, and custom leave types
- **Date Range Selection**: Flexible start and end date picking
- **Reason Documentation**: Detailed reason for leave requests
- **File Attachments**: Support for medical certificates and documents
- **Request History**: Complete history of all leave requests

### ✅ Approval Workflow
- **Two-tier Approval**: Manager → HR approval process
- **Direct Manager Approval**: Managers can approve certain leave types directly
- **Bulk Operations**: Approve/reject multiple requests
- **Email Notifications**: Automated notifications for status changes
- **Comments System**: Add comments during approval process

### 📊 Dashboard & Analytics
- **Role-specific Dashboards**: Customized views for different user roles
- **Leave Statistics**: Visual charts and graphs
- **Balance Tracking**: Real-time leave balance monitoring
- **Upcoming Leaves**: Calendar view of scheduled leaves
- **Team Overview**: Manager view of team leave status

### 🎛️ Administrative Features
- **System Configuration**: Manage leave types, policies, and settings
- **User Management**: Create, update, and deactivate users
- **Department Management**: Organize company structure
- **Leave Policy Configuration**: Set leave entitlements and rules
- **Audit Logs**: Complete system activity tracking

## 🛠️ Technology Stack

### Frontend
- **React.js 18**: Modern UI library with hooks
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **CSS3**: Responsive styling
- **Date-fns**: Date manipulation library

### Backend
- **Node.js**: JavaScript runtime
- **Hapi.js**: Web framework
- **TypeScript**: Type-safe JavaScript
- **TypeORM**: Object-Relational Mapping
- **PostgreSQL**: Primary database
- **JWT**: Authentication tokens
- **Bcrypt**: Password hashing
- **Winston**: Professional logging
- **Joi**: Data validation

### Development Tools
- **Nodemon**: Development server
- **ts-node**: TypeScript execution
- **ESLint**: Code linting
- **Prettier**: Code formatting

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React.js)    │◄──►│   (Node.js)     │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │                 │
│ • Components    │    │ • Controllers   │    │ • Tables        │
│ • Services      │    │ • Routes        │    │ • Relations     │
│ • State Mgmt    │    │ • Middleware    │    │ • Indexes       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Request Flow
```
User Action → React Component → API Service → Backend Route → Controller → Database → Response
```

## 👤 User Roles & Permissions

### 🟢 Employee
- View personal dashboard
- Submit leave requests
- View own leave history
- Update personal profile
- Check leave balances

### 🟡 Manager
- All Employee permissions
- View team leave requests
- Approve/reject team leave requests
- View team dashboard
- Manage direct reports

### 🟠 HR
- All Manager permissions
- Final approval authority
- View all employee data
- Manage leave policies
- Generate reports
- Bulk operations

### 🔴 Admin
- All HR permissions
- User management (create/deactivate)
- System configuration
- Department management
- Access to all system features

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

### Backend Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd Leave_management/backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**
```bash
cp .env.example .env
```

Edit `.env` file:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=leave_management

# JWT Configuration
JWT_SECRET=your_super_secret_key

# Server Configuration
PORT=5000
NODE_ENV=development
```

4. **Database Setup**
```bash
# Create database
createdb leave_management

# Run migrations (automatic with TypeORM)
npm run dev
```

5. **Seed Initial Data**
```bash
npm run seed
```

6. **Start Development Server**
```bash
npm run dev
```

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd ../frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Start Development Server**
```bash
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API Documentation: http://localhost:5000/documentation

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/auth/login
Login user and get JWT token
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### POST /api/auth/register
Register new user (Admin only)
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "Employee",
  "department": "IT",
  "managerId": 1
}
```

### Leave Request Endpoints

#### GET /api/leave-requests
Get leave requests (filtered by role)

#### POST /api/leave-requests
Create new leave request
```json
{
  "leaveTypeId": 1,
  "startDate": "2024-01-15",
  "endDate": "2024-01-17",
  "reason": "Family vacation"
}
```

#### PUT /api/leave-requests/{id}/approve
Approve leave request (Manager/HR only)

#### PUT /api/leave-requests/{id}/reject
Reject leave request (Manager/HR only)

### Employee Endpoints

#### GET /api/employees
Get all employees (filtered by permissions)

#### GET /api/employees/{id}
Get employee details

#### PUT /api/employees/{id}
Update employee information

### Dashboard Endpoints

#### GET /api/dashboard
Get role-specific dashboard data

### Leave Type Endpoints

#### GET /api/leave-types
Get all leave types

#### POST /api/leave-types
Create new leave type (HR/Admin only)

## 🗄️ Database Schema

### Core Tables

#### employees
```sql
- id (Primary Key)
- name (VARCHAR)
- email (VARCHAR, Unique)
- username (VARCHAR, Unique)
- password (VARCHAR, Hashed)
- role (ENUM: Employee, Manager, HR, Admin)
- department_id (Foreign Key)
- manager_id (Foreign Key, Self-reference)
- annual_leave_balance (INTEGER)
- sick_leave_balance (INTEGER)
- personal_leave_balance (INTEGER)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### leave_requests
```sql
- id (Primary Key)
- employee_id (Foreign Key)
- leave_type_id (Foreign Key)
- start_date (DATE)
- end_date (DATE)
- reason (TEXT)
- status (ENUM: Pending, Approved, Rejected)
- manager_approval (ENUM: Pending, Approved, Rejected)
- hr_approval (ENUM: Pending, Approved, Rejected)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### leave_types
```sql
- id (Primary Key)
- name (VARCHAR)
- description (TEXT)
- max_days_per_year (INTEGER)
- requires_manager_approval (BOOLEAN)
- requires_hr_approval (BOOLEAN)
- is_active (BOOLEAN)
```

#### departments
```sql
- id (Primary Key)
- name (VARCHAR)
- description (TEXT)
- manager_id (Foreign Key)
- is_active (BOOLEAN)
```

#### approvals
```sql
- id (Primary Key)
- leave_request_id (Foreign Key)
- approver_id (Foreign Key)
- approval_level (ENUM: Manager, HR)
- status (ENUM: Pending, Approved, Rejected)
- comments (TEXT)
- approved_at (TIMESTAMP)
```

### Relationships
- Employee → Department (Many-to-One)
- Employee → Manager (Many-to-One, Self-reference)
- Leave Request → Employee (Many-to-One)
- Leave Request → Leave Type (Many-to-One)
- Approval → Leave Request (One-to-Many)
- Approval → Employee (Many-to-One)

## 🔄 Workflow Diagrams

### Leave Request Workflow
```
Employee Submits Request
         ↓
    Manager Review
    ↙         ↘
Approve      Reject
   ↓           ↓
HR Review   Request Denied
↙      ↘         ↓
Approve Reject  End
   ↓      ↓
Final   Request
Approval Denied
   ↓      ↓
  End    End
```

### User Authentication Flow
```
User Login → Validate Credentials → Generate JWT → Store Token → Access Protected Routes
```

### Leave Balance Update Flow
```
Leave Approved → Calculate Days → Update Employee Balance → Log Transaction → Notify Employee
```

## 🔒 Security Features

### Authentication Security
- **JWT Tokens**: Secure, stateless authentication
- **Password Hashing**: Bcrypt with salt rounds
- **Token Expiration**: Automatic session timeout
- **Refresh Tokens**: Seamless token renewal

### Authorization Security
- **Role-based Access Control**: Granular permissions
- **Route Protection**: Middleware-based security
- **Data Filtering**: Users see only authorized data
- **Input Validation**: Joi schema validation

### Data Security
- **SQL Injection Prevention**: TypeORM query builder
- **XSS Protection**: Input sanitization
- **CORS Configuration**: Cross-origin request control
- **Environment Variables**: Sensitive data protection

## 📊 Logging & Monitoring

### Winston Logger Implementation
- **Log Levels**: Error, Warn, Info, HTTP, Debug
- **File Logging**: Separate error and combined logs
- **Console Logging**: Colored output for development
- **Structured Logging**: JSON format for production
- **Log Rotation**: Configurable file rotation

### Log Files
- `logs/error.log`: Error-level logs only
- `logs/combined.log`: All application logs
- Console output: Development environment

### Monitoring Points
- API request/response logging
- Database operation logging
- Authentication attempt logging
- Error tracking and reporting
- Performance metrics logging

## 🧪 Testing

### Test Structure
```
tests/
├── unit/
│   ├── controllers/
│   ├── services/
│   └── utils/
├── integration/
│   ├── api/
│   └── database/
└── e2e/
    ├── auth/
    ├── leave-requests/
    └── dashboard/
```

### Running Tests
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# All tests
npm test

# Test coverage
npm run test:coverage
```

## 🚀 Deployment

### Production Environment Setup

1. **Environment Configuration**
```env
NODE_ENV=production
DB_HOST=production-db-host
JWT_SECRET=production-secret-key
PORT=80
```

2. **Database Migration**
```bash
npm run build
npm run migrate:prod
```

3. **Process Management**
```bash
# Using PM2
npm install -g pm2
pm2 start ecosystem.config.js
```

4. **Nginx Configuration**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Docker Deployment
```dockerfile
# Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards
- **TypeScript**: Strict type checking
- **ESLint**: Code linting rules
- **Prettier**: Code formatting
- **Conventional Commits**: Commit message format

### Pull Request Guidelines
- Include tests for new features
- Update documentation
- Follow existing code style
- Add meaningful commit messages

## 📞 Support & Contact

For support, questions, or contributions:
- **Email**: support@leavemanagement.com
- **Documentation**: [Project Wiki](link-to-wiki)
- **Issues**: [GitHub Issues](link-to-issues)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ by [Your Team Name]**

*Last Updated: December 2024*