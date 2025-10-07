-- This script contains the complete schema for the application's PostgreSQL database.
-- It uses 'IF NOT EXISTS' to be safely executable multiple times.

-- Create custom enum types only if they don't already exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('system_admin', 'employee', 'customer');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('new', 'preparing', 'ready', 'out_for_delivery', 'completed', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_type') THEN
        CREATE TYPE order_type AS ENUM ('delivery', 'pickup');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('paid', 'unpaid');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'debt_type') THEN
        CREATE TYPE debt_type AS ENUM ('debtor', 'creditor');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'debt_status') THEN
        CREATE TYPE debt_status AS ENUM ('paid', 'unpaid');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        CREATE TYPE transaction_type AS ENUM ('revenue', 'expense');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_classification') THEN
        CREATE TYPE transaction_classification AS ENUM ('sales', 'purchases', 'debt_payment', 'expense', 'salary', 'other');
    END IF;
END$$;

-- Table for Users / Customers / Employees
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'customer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for User/Employee additional details
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    job_title VARCHAR(100),
    national_id VARCHAR(50),
    salary DECIMAL(10, 2),
    currency VARCHAR(10),
    hire_date DATE,
    notes TEXT
);

-- Table for Customer Addresses
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address_name VARCHAR(100) NOT NULL, -- e.g., 'المنزل', 'العمل'
    address_details TEXT NOT NULL,
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Employee Records
CREATE TABLE IF NOT EXISTS employee_absences (
    id BIGSERIAL PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    reason TEXT,
    deduction DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_advances (
    id BIGSERIAL PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_bonuses (
    id BIGSERIAL PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- Table for Product Categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- Table for Products
CREATE TABLE IF NOT EXISTS products (
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

-- Table for Inventory
CREATE TABLE IF NOT EXISTS inventory (
    id BIGSERIAL PRIMARY KEY,
    product_id UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Recipes
CREATE TABLE IF NOT EXISTS recipes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    prep_time_minutes INT,
    cook_time_minutes INT,
    ingredients TEXT,
    instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Online and POS Orders
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(255),
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
CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL,
    price_per_item DECIMAL(10, 2) NOT NULL,
    notes TEXT
);

-- Table for Branches
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    address TEXT,
    phone_number VARCHAR(20),
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Table for Financial Transactions (Accounting Fund)
CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type transaction_type NOT NULL,
    classification transaction_classification NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    description TEXT,
    related_id VARCHAR(255),
    transaction_date TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Currencies
CREATE TABLE IF NOT EXISTS currencies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    symbol VARCHAR(10) NOT NULL UNIQUE,
    exchange_rate_to_main DECIMAL(12, 6) NOT NULL,
    is_main_currency BOOLEAN DEFAULT FALSE
);

-- Table for Banks
CREATE TABLE IF NOT EXISTS banks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    iban VARCHAR(100),
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00
);

-- Table for Debts
CREATE TABLE IF NOT EXISTS debts (
    id BIGSERIAL PRIMARY KEY,
    person_name VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type debt_type NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    due_date DATE,
    status debt_status NOT NULL DEFAULT 'unpaid',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    address TEXT,
    contact_person VARCHAR(255)
);

-- Table for Purchases
CREATE TABLE IF NOT EXISTS purchases (
    id BIGSERIAL PRIMARY KEY,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100),
    purchase_date TIMESTAMPTZ DEFAULT NOW(),
    total_amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    notes TEXT
);

-- Table for Purchase Items
CREATE TABLE IF NOT EXISTS purchase_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_id BIGINT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    price_per_unit DECIMAL(10, 2) NOT NULL
);

-- Table for Restaurant Needs
CREATE TABLE IF NOT EXISTS needs (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    quantity VARCHAR(100) NOT NULL,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'required', -- 'required', 'purchased'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- Table for Complaints
CREATE TABLE IF NOT EXISTS complaints (
    id BIGSERIAL PRIMARY KEY,
    customer_name VARCHAR(255),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new', -- 'new', 'in_progress', 'resolved', 'closed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Coupons
CREATE TABLE IF NOT EXISTS coupons (
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
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'available', -- 'available', 'on_mission'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Delivery Missions
CREATE TABLE IF NOT EXISTS delivery_missions (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'assigned', -- 'assigned', 'picked_up', 'delivered', 'cancelled'
    commission DECIMAL(10, 2),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Table for system-wide settings
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for user-specific permissions
CREATE TABLE IF NOT EXISTS user_permissions (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    permissions JSONB NOT NULL
);

-- Table for peak hours analysis
CREATE TABLE IF NOT EXISTS peak_hours (
    id SERIAL PRIMARY KEY,
    day VARCHAR(20) NOT NULL,
    hour_range VARCHAR(50) NOT NULL,
    orders INT NOT NULL
);

-- Table for daily aggregated summaries
CREATE TABLE IF NOT EXISTS daily_summaries (
    id BIGSERIAL PRIMARY KEY,
    summary_date DATE NOT NULL UNIQUE,
    net_sales DECIMAL(12, 2) NOT NULL,
    total_refunds INT NOT NULL,
    total_orders INT NOT NULL,
    cash_total DECIMAL(12, 2) NOT NULL,
    card_total DECIMAL(12, 2) NOT NULL,
    network_total DECIMAL(12, 2) NOT NULL,
    network_by_bank JSONB,
    top_selling_items JSONB,
    cashier_performance JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_branch_id ON transactions(branch_id);
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_missions_driver_id ON delivery_missions(driver_id);
