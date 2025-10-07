-- Create custom enum types
CREATE TYPE user_role AS ENUM ('system_admin', 'employee', 'customer');
CREATE TYPE order_status AS ENUM ('new', 'preparing', 'ready', 'out_for_delivery', 'completed', 'rejected');
CREATE TYPE order_type AS ENUM ('delivery', 'pickup');
CREATE TYPE payment_status AS ENUM ('paid', 'unpaid');
CREATE TYPE debt_type AS ENUM ('debtor', 'creditor');
CREATE TYPE debt_status AS ENUM ('paid', 'unpaid');
CREATE TYPE transaction_type AS ENUM ('revenue', 'expense');
CREATE TYPE transaction_classification AS ENUM ('sales', 'purchases', 'debt_payment', 'expense', 'salary', 'other');


-- Table for Users / Customers / Employees
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'customer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for User/Employee additional details
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    job_title VARCHAR(100),
    national_id VARCHAR(50),
    hire_date DATE,
    notes TEXT,
    salary DECIMAL(10, 2),
    currency VARCHAR(10)
);

-- Table for Customer Addresses
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address_name VARCHAR(100) NOT NULL, -- e.g., 'المنزل', 'العمل'
    address_details TEXT NOT NULL,
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Product Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- Table for Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Online and POS Orders
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Can be null for POS guest orders
    customer_name VARCHAR(255), -- For guests
    customer_phone VARCHAR(255), -- For guests
    status order_status NOT NULL DEFAULT 'new',
    type order_type NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    final_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    payment_status payment_status NOT NULL,
    payment_proof_url TEXT,
    address_id UUID REFERENCES addresses(id),
    order_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table for items in an order
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL,
    price_per_item DECIMAL(10, 2) NOT NULL, -- Price at time of order
    notes TEXT
);

-- Table for Branches
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    address TEXT,
    phone_number VARCHAR(20),
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Table for Financial Transactions (Accounting Fund)
-- Storing description as JSONB to allow for structured details like recipient
CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- User who performed the transaction
    type transaction_type NOT NULL,
    classification transaction_classification NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    description JSONB,
    related_id VARCHAR(255), -- e.g., order_id, purchase_id
    transaction_date TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Currencies
CREATE TABLE currencies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    symbol VARCHAR(10) NOT NULL UNIQUE,
    exchange_rate_to_main DECIMAL(12, 6) NOT NULL,
    is_main_currency BOOLEAN DEFAULT FALSE
);

-- Table for Debts
CREATE TABLE debts (
    id BIGSERIAL PRIMARY KEY,
    person_name VARCHAR(255) NOT NULL, -- Can be a customer or external person
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- If the person is a user
    type debt_type NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    due_date DATE,
    status debt_status NOT NULL DEFAULT 'unpaid',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- Table for Suppliers
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    address TEXT,
    contact_person VARCHAR(255)
);

-- Table for Purchases
CREATE TABLE purchases (
    id BIGSERIAL PRIMARY KEY,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100),
    purchase_date TIMESTAMPTZ DEFAULT NOW(),
    total_amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    notes TEXT
);

-- Table for Purchase Items
CREATE TABLE purchase_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_id BIGINT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    price_per_unit DECIMAL(10, 2) NOT NULL
);

-- Table for Complaints
CREATE TABLE complaints (
    id BIGSERIAL PRIMARY KEY,
    customer_name VARCHAR(255),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new', -- 'new', 'in_progress', 'resolved', 'closed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Coupons
CREATE TABLE coupons (
    id VARCHAR(50) PRIMARY KEY,
    type VARCHAR(20) NOT NULL, -- 'percentage' or 'fixed_amount'
    value DECIMAL(10, 2) NOT NULL,
    max_uses INT,
    times_used INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expiry_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Drivers
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'available', -- 'available', 'on_mission'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Delivery Missions
CREATE TABLE delivery_missions (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'assigned', -- 'assigned', 'picked_up', 'delivered', 'cancelled'
    commission DECIMAL(10, 2),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);


-- Table for User Permissions (JSONB for flexibility)
CREATE TABLE user_permissions (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    permissions JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for System Settings
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Peak Hours Analysis
CREATE TABLE peak_hours (
    id SERIAL PRIMARY KEY,
    day VARCHAR(20) NOT NULL,
    hour_range VARCHAR(50) NOT NULL,
    orders INT NOT NULL,
    UNIQUE(day, hour_range)
);


-- Table for Employee Absences
CREATE TABLE employee_absences (
    id SERIAL PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    reason TEXT,
    deduction DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Employee Salary Advances/Payments
CREATE TABLE employee_advances (
    id SERIAL PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Employee Bonuses
CREATE TABLE employee_bonuses (
    id SERIAL PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- Indexes for performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_transactions_branch_id ON transactions(branch_id);
CREATE INDEX idx_debts_user_id ON debts(user_id);
CREATE INDEX idx_delivery_missions_driver_id ON delivery_missions(driver_id);
CREATE INDEX idx_employee_absences_employee_id ON employee_absences(employee_id);
CREATE INDEX idx_employee_advances_employee_id ON employee_advances(employee_id);
CREATE INDEX idx_employee_bonuses_employee_id ON employee_bonuses(employee_id);
