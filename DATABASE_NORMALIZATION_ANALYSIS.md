# Database Normalization Analysis - Current State

## Current Database Status: **PARTIALLY NORMALIZED (2NF)**

### Current Departments in Use:
Based on the codebase analysis, the following departments are currently defined:
- **IT** (Information Technology) - Default
- **HR** (Human Resources)
- **Finance**
- **Marketing**
- **Operations**
- **Sales**
- **Engineering**
- **Customer Support**

### Current Leave Types in Use:
- **Annual Leave** - Default
- **Sick Leave**
- **Personal Leave**
- **Other**

---

## 🔍 Normalization Analysis

### **First Normal Form (1NF)** - SATISFIED
- All tables have atomic values
- No repeating groups
- Primary keys properly defined
- Each column contains single values

### **Second Normal Form (2NF)** - SATISFIED
- All tables are in 1NF
- No partial dependencies (all tables use single-column primary keys)
- All non-key attributes fully depend on the primary key

### **Third Normal Form (3NF)** - VIOLATED

#### Issues Found:

1. **Department Denormalization** 
   ```typescript
   // Current implementation in Employee entity
   @Column({ 
     type: 'enum', 
     enum: ['IT', 'HR', 'Finance', 'Marketing', 'Operations', 'Sales', 'Engineering', 'Customer Support'],
     default: 'IT'
   })
   department!: string;
   ```
   **Problems:**
   - Department information is repeated across all employee records
   - Cannot store additional department metadata (description, manager, budget, etc.)
   - Hard to modify department names or add new departments
   - Violates 3NF principle of eliminating transitive dependencies

2. **Leave Type Denormalization** 
   ```typescript
   // Current implementation in LeaveRequest entity
   @Column({
     type: 'enum',
     enum: ['Annual Leave', 'Sick Leave', 'Personal Leave', 'Other'],
     default: 'Annual Leave'
   })
   leaveType!: 'Annual Leave' | 'Sick Leave' | 'Personal Leave' | 'Other';
   ```
   **Problems:**
   - Leave type information is embedded in each leave request
   - Cannot store leave type metadata (max days allowed, description, etc.)
   - Hard to add new leave types or modify existing ones
   - Business rules for leave types are scattered across the codebase

3. **Missing Audit Trail** 
   - Employee table lacks `createdAt` and `updatedAt` timestamps
   - Limited tracking of when records were created or modified

---

##  Recommended Normalized Schema

### New Tables to Create:

#### 1. **departments** Table
```sql
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    description TEXT,
    head_id INTEGER REFERENCES employees(id),
    budget DECIMAL(12,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Sample Data:**
```sql
INSERT INTO departments (name, code, description) VALUES
('Information Technology', 'IT', 'Technology and software development'),
('Human Resources', 'HR', 'Employee management and recruitment'),
('Finance', 'FIN', 'Financial planning and accounting'),
('Marketing', 'MKT', 'Marketing and brand management'),
('Operations', 'OPS', 'Business operations and logistics'),
('Sales', 'SAL', 'Sales and customer acquisition'),
('Engineering', 'ENG', 'Product engineering and development'),
('Customer Support', 'CS', 'Customer service and support');
```

#### 2. **leave_types** Table
```sql
CREATE TABLE leave_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    max_days_per_year INTEGER DEFAULT 0,
    requires_approval BOOLEAN DEFAULT true,
    approval_levels INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Sample Data:**
```sql
INSERT INTO leave_types (name, description, max_days_per_year, approval_levels) VALUES
('Annual Leave', 'Yearly vacation leave', 20, 2),
('Sick Leave', 'Medical leave for illness', 10, 1),
('Personal Leave', 'Personal time off', 5, 2),
('Maternity Leave', 'Leave for new mothers', 90, 1),
('Paternity Leave', 'Leave for new fathers', 15, 1),
('Emergency Leave', 'Emergency situations', 3, 1),
('Other', 'Other types of leave', 0, 2);
```

### Updated Tables:

#### 1. **employees** Table Changes
```sql
-- Remove enum column
ALTER TABLE employees DROP COLUMN department;

-- Add foreign key reference
ALTER TABLE employees ADD COLUMN department_id INTEGER REFERENCES departments(id);

-- Add audit timestamps
ALTER TABLE employees ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE employees ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
```

#### 2. **leave_requests** Table Changes
```sql
-- Remove enum column
ALTER TABLE leave_requests DROP COLUMN leave_type;

-- Add foreign key reference
ALTER TABLE leave_requests ADD COLUMN leave_type_id INTEGER REFERENCES leave_types(id);

-- Add audit timestamp
ALTER TABLE leave_requests ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
```

---

## Benefits of Normalization

### **Data Integrity**
- **Eliminates Redundancy**: Department and leave type information stored once
- **Consistency**: Changes to department/leave type names reflect everywhere
- **Referential Integrity**: Foreign key constraints prevent orphaned records

### **Flexibility**
- **Easy Expansion**: Add new departments/leave types without code changes
- **Rich Metadata**: Store additional information (descriptions, limits, rules)
- **Business Rules**: Centralized management of leave policies

### **Performance**
- **Reduced Storage**: Less duplicate data
- **Better Indexing**: Optimized queries on normalized tables
- **Efficient Reporting**: Join operations for comprehensive reports

### **Maintainability**
- **Single Source of Truth**: Department/leave type changes in one place
- **Code Simplification**: Less hardcoded values in application logic
- **Future-Proof**: Easy to extend with new features

---

## Migration Strategy

### Phase 1: Create Normalized Tables
1. Create `departments` table with existing department data
2. Create `leave_types` table with existing leave type data
3. Populate tables with current enum values

### Phase 2: Update Existing Tables
1. Add foreign key columns to `employees` and `leave_requests`
2. Migrate existing enum data to foreign key references
3. Add audit timestamp columns

### Phase 3: Update Application Code
1. Modify entities to use foreign key relationships
2. Update controllers to work with normalized data
3. Update API responses to include related data
4. Update validation schemas

### Phase 4: Remove Old Columns
1. Drop enum columns after successful migration
2. Update database constraints
3. Clean up unused code

---

##  Current Issues Impact

### **Department Issues:**
- **Hard to Scale**: Adding new departments requires code changes
- **No Metadata**: Cannot store department head, budget, or description
- **Inconsistent Naming**: Risk of typos in department names
- **Reporting Limitations**: Difficult to generate department-wise reports

### **Leave Type Issues:**
- **Inflexible Policies**: Cannot set different rules per leave type
- **No Limits**: Cannot enforce max days per leave type
- **Approval Complexity**: Cannot vary approval levels by leave type
- **Business Logic Scattered**: Leave type rules spread across codebase

---

## Immediate Recommendations

### **High Priority:**
1. **Create normalized tables** for departments and leave types
2. **Migrate existing data** to maintain current functionality
3. **Update entities** to use foreign key relationships
4. **Add audit timestamps** for better tracking

### **Medium Priority:**
1. **Update API documentation** to reflect new schema
2. **Enhance business rules** using normalized data
3. **Improve reporting capabilities** with proper joins
4. **Add data validation** at database level

### **Low Priority:**
1. **Add department management** features
2. **Implement leave type policies** (max days, approval levels)
3. **Create admin interfaces** for managing reference data
4. **Add historical tracking** for changes

---

## Implementation Guide

### Files Created:
**Entities:**
- `src/entities/Department.ts` - Normalized department entity
- `src/entities/LeaveType.ts` - Normalized leave type entity

**Migration Scripts:**
- `src/seedNormalizedData.ts` - Seeds reference data
- `src/migrations/normalizeExistingData.ts` - Migrates existing data
- `src/runNormalization.ts` - Main migration runner

**Package Scripts:**
- `npm run seed:normalized` - Seed only reference tables
- `npm run normalize-db` - Full migration process

### How to Run Normalization:

#### Option 1: Full Migration (Recommended)
```bash
cd backend
npm run normalize-db
```

#### Option 2: Step by Step
```bash
cd backend
# 1. Seed reference data only
npm run seed:normalized

# 2. Run full migration
npm run normalize-db
```

### What the Migration Does:

1. **Creates normalized tables** (`departments`, `leave_types`)
2. **Populates reference data** based on current enums
3. **Migrates existing employee departments** to foreign key references
4. **Migrates existing leave request types** to foreign key references
5. **Verifies data integrity** after migration
6. **Provides detailed logging** of the process

### After Migration:

1. **Update entities** to use the new normalized relationships
2. **Update data source** to include new entities
3. **Update controllers** to work with normalized data
4. **Update API documentation** to reflect new schema
5. **Test all functionality** thoroughly

---

## Current Status Summary

### **What's Ready:**
- Comprehensive normalization analysis
- Normalized entity definitions
- Safe migration scripts
- Reference data seeding
- Package scripts for easy execution

### **Next Steps:**
1. **Run the migration**: `npm run normalize-db`
2. **Update entities** to use foreign key relationships
3. **Update application code** to work with normalized data
4. **Test thoroughly** before deploying to production

This normalization will bring your database to **3NF compliance** and provide a solid foundation for future enhancements while maintaining data integrity and improving system flexibility.