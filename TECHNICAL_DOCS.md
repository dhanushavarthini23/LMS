# Technical Documentation - Leave Management System

## 🏗️ Architecture Overview

### System Components
```
┌─────────────────────────────────────────────────────────────┐
│                    Leave Management System                   │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React.js)                                        │
│  ├── Components (UI Elements)                               │
│  ├── Services (API Communication)                           │
│  ├── Context (State Management)                             │
│  └── Utils (Helper Functions)                               │
├─────────────────────────────────────────────────────────────┤
│  Backend (Node.js + Hapi.js)                               │
│  ├── Controllers (Business Logic)                           │
│  ├── Routes (API Endpoints)                                 │
│  ├── Middleware (Authentication, Logging)                   │
│  ├── Entities (Database Models)                             │
│  └── Utils (Helper Functions, Logger)                       │
├─────────────────────────────────────────────────────────────┤
│  Database (PostgreSQL)                                      │
│  ├── Tables (Data Storage)                                  │
│  ├── Relations (Foreign Keys)                               │
│  ├── Indexes (Performance)                                  │
│  └── Constraints (Data Integrity)                           │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

### Backend Structure
```
backend/
├── src/
│   ├── controllers/           # Business logic handlers
│   │   ├── employeeController.ts
│   │   ├── ApprovalController.ts
│   │   └── authController.ts
│   ├── routes/               # API route definitions
│   │   ├── employeeRoutes.ts
│   │   ├── leaveRoutes.ts
│   │   ├── leaveTypeRoutes.ts
│   │   ├── departmentRoutes.ts
│   │   ├── adminRoutes.ts
│   │   └── dashboardRoutes.ts
│   ├── entities/             # TypeORM database models
│   │   ├── Employee.ts
│   │   ├── LeaveRequest.ts
│   │   ├── LeaveType.ts
│   │   ├── Department.ts
│   │   └── Approval.ts
│   ├── middlewares/          # Custom middleware
│   │   ├── auth.ts
│   │   └── logging.ts
│   ├── utils/               # Utility functions
│   │   └── logger.ts
│   ├── migrations/          # Database migrations
│   ├── config/             # Configuration files
│   ├── data-source.ts      # TypeORM configuration
│   └── server.ts           # Main server file
├── logs/                   # Winston log files
├── package.json
├── tsconfig.json
└── .env
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── Dashboard.jsx
│   │   ├── EmployeeManagement.jsx
│   │   ├── LeaveRequestForm.jsx
│   │   ├── LeaveTypeManagement.jsx
│   │   ├── Login.jsx
│   │   └── Navigation.jsx
│   ├── services/           # API service functions
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── employeeService.js
│   │   └── leaveService.js
│   ├── context/           # React context for state
│   │   └── AuthContext.js
│   ├── utils/             # Utility functions
│   ├── styles/            # CSS files
│   ├── App.js             # Main app component
│   └── index.js           # Entry point
├── public/
├── package.json
└── .env
```

## 🔧 Technical Implementation Details

### Authentication Flow

#### JWT Token Implementation
```typescript
// Token Generation (authController.ts)
const token = jwt.sign(
  { 
    id: employee.id, 
    email: employee.email, 
    role: employee.role 
  },
  JWT_SECRET,
  { expiresIn: '24h' }
);

// Token Verification (auth middleware)
const decoded = jwt.verify(token, JWT_SECRET);
request.auth = { credentials: decoded };
```

#### Password Security
```typescript
// Password Hashing
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Password Verification
const isValid = await bcrypt.compare(password, hashedPassword);
```

### Database Design

#### Entity Relationships
```typescript
// Employee Entity
@Entity()
export class Employee {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'manager_id' })
  manager: Employee;

  @OneToMany(() => LeaveRequest, leaveRequest => leaveRequest.employee)
  leaveRequests: LeaveRequest[];
}

// Leave Request Entity
@Entity()
export class LeaveRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Employee, employee => employee.leaveRequests)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ManyToOne(() => LeaveType)
  @JoinColumn({ name: 'leave_type_id' })
  leaveType: LeaveType;

  @OneToMany(() => Approval, approval => approval.leaveRequest)
  approvals: Approval[];
}
```

#### Database Indexes
```sql
-- Performance indexes
CREATE INDEX idx_employee_email ON employees(email);
CREATE INDEX idx_employee_role ON employees(role);
CREATE INDEX idx_leave_request_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_request_status ON leave_requests(status);
CREATE INDEX idx_leave_request_dates ON leave_requests(start_date, end_date);
```

### API Design Patterns

#### RESTful Endpoints
```typescript
// Resource-based URLs
GET    /api/employees           # Get all employees
POST   /api/employees           # Create employee
GET    /api/employees/{id}      # Get specific employee
PUT    /api/employees/{id}      # Update employee
DELETE /api/employees/{id}      # Delete employee

// Nested resources
GET    /api/employees/{id}/leave-requests    # Get employee's leaves
POST   /api/leave-requests/{id}/approve      # Approve leave request
```

#### Response Format Standardization
```typescript
// Success Response
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}

// Error Response
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### State Management (Frontend)

#### React Context Implementation
```javascript
// AuthContext.js
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    setUser(response.user);
    setToken(response.token);
    localStorage.setItem('token', response.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Error Handling

#### Backend Error Handling
```typescript
// Global error handler
server.ext('onPreResponse', (request, h) => {
  const response = request.response;
  
  if (response.isBoom) {
    logger.error('API Error:', {
      path: request.path,
      method: request.method,
      error: response.message
    });
    
    return h.response({
      error: response.message,
      statusCode: response.output.statusCode
    }).code(response.output.statusCode);
  }
  
  return h.continue;
});
```

#### Frontend Error Handling
```javascript
// API service error handling
const apiCall = async (url, options) => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
```

### Logging Implementation

#### Winston Logger Configuration
```typescript
// logger.ts
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

#### Logging Best Practices
```typescript
// Structured logging
logger.info('User login attempt', {
  email: user.email,
  ip: request.info.remoteAddress,
  userAgent: request.headers['user-agent']
});

// Error logging with context
logger.error('Database connection failed', {
  error: error.message,
  stack: error.stack,
  query: failedQuery
});
```

## 🔐 Security Implementation

### Input Validation
```typescript
// Joi validation schemas
const employeeSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  role: Joi.string().valid('Employee', 'Manager', 'HR', 'Admin').required(),
  department: Joi.string().required()
});

// Route validation
{
  method: 'POST',
  path: '/api/employees',
  options: {
    validate: {
      payload: employeeSchema
    }
  }
}
```

### Authorization Middleware
```typescript
// Role-based access control
export const requireRole = (roles: string[]) => {
  return (request: Request, h: ResponseToolkit) => {
    const userRole = request.auth.credentials.role;
    
    if (!roles.includes(userRole)) {
      throw Boom.forbidden('Insufficient permissions');
    }
    
    return h.continue;
  };
};

// Usage in routes
{
  method: 'POST',
  path: '/api/employees',
  options: {
    auth: 'jwt',
    pre: [requireRole(['Admin', 'HR'])]
  }
}
```

### CORS Configuration
```typescript
// CORS setup
const server = Hapi.server({
  port: process.env.PORT || 5000,
  host: 'localhost',
  routes: {
    cors: {
      origin: ['http://localhost:3000'],
      credentials: true
    }
  }
});
```

## 📊 Performance Optimization

### Database Optimization
```typescript
// Eager loading relationships
const employees = await employeeRepo.find({
  relations: ['department', 'manager', 'leaveRequests']
});

// Query optimization with select
const employees = await employeeRepo
  .createQueryBuilder('employee')
  .select(['employee.id', 'employee.name', 'employee.email'])
  .leftJoinAndSelect('employee.department', 'department')
  .where('employee.isActive = :active', { active: true })
  .getMany();
```

### Caching Strategy
```typescript
// In-memory caching for frequently accessed data
const cache = new Map();

const getLeaveTypes = async () => {
  const cacheKey = 'leave_types';
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const leaveTypes = await leaveTypeRepo.find();
  cache.set(cacheKey, leaveTypes);
  
  // Cache expiry
  setTimeout(() => cache.delete(cacheKey), 300000); // 5 minutes
  
  return leaveTypes;
};
```

### Frontend Optimization
```javascript
// React.memo for component optimization
const EmployeeCard = React.memo(({ employee }) => {
  return (
    <div className="employee-card">
      <h3>{employee.name}</h3>
      <p>{employee.email}</p>
    </div>
  );
});

// useMemo for expensive calculations
const filteredEmployees = useMemo(() => {
  return employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [employees, searchTerm]);
```

## 🧪 Testing Strategy

### Unit Testing
```typescript
// Controller unit test
describe('EmployeeController', () => {
  it('should create employee successfully', async () => {
    const mockEmployee = {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Employee'
    };
    
    const result = await employeeController.createEmployee(
      { payload: mockEmployee },
      mockResponseToolkit
    );
    
    expect(result.statusCode).toBe(201);
    expect(result.source.name).toBe('John Doe');
  });
});
```

### Integration Testing
```typescript
// API integration test
describe('Employee API', () => {
  it('should create and retrieve employee', async () => {
    const employee = await request(server)
      .post('/api/employees')
      .send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'Employee'
      })
      .expect(201);
    
    const retrieved = await request(server)
      .get(`/api/employees/${employee.body.id}`)
      .expect(200);
    
    expect(retrieved.body.name).toBe('Jane Doe');
  });
});
```

## 🚀 Deployment Configuration

### Environment Variables
```bash
# Production environment
NODE_ENV=production
PORT=80
DB_HOST=prod-db.example.com
DB_PORT=5432
DB_USERNAME=prod_user
DB_PASSWORD=secure_password
DB_NAME=leave_management_prod
JWT_SECRET=super_secure_jwt_secret
LOG_LEVEL=warn
```

### PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'leave-management-api',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log'
  }]
};
```

### Docker Configuration
```dockerfile
# Multi-stage build
FROM node:16-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:16-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npm run build

EXPOSE 5000
CMD ["npm", "start"]
```

## 📈 Monitoring & Maintenance

### Health Check Endpoint
```typescript
// Health check route
{
  method: 'GET',
  path: '/health',
  handler: async (request, h) => {
    try {
      // Check database connection
      await AppDataSource.query('SELECT 1');
      
      return h.response({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version
      }).code(200);
    } catch (error) {
      return h.response({
        status: 'unhealthy',
        error: error.message
      }).code(503);
    }
  }
}
```

### Performance Monitoring
```typescript
// Request timing middleware
const requestTimer = (request: Request, h: ResponseToolkit) => {
  const start = Date.now();
  
  request.events.once('response', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: request.method,
      path: request.path,
      duration: `${duration}ms`,
      statusCode: request.response.statusCode
    });
  });
  
  return h.continue;
};
```

## 🔄 Development Workflow

### Git Workflow
```bash
# Feature development
git checkout -b feature/new-feature
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Code review and merge
# Create pull request
# Review and approve
git checkout main
git pull origin main
```

### Code Quality Tools
```json
// package.json scripts
{
  "scripts": {
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write src/**/*.ts",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

This technical documentation provides comprehensive details for developers working on the Leave Management System. It covers architecture, implementation patterns, security measures, and deployment strategies.