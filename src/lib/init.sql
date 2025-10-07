-- Drop tables if they exist to ensure a clean slate
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS peak_hours CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('system_admin', 'employee', 'customer')),
    phone_number VARCHAR(20) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_permissions table
CREATE TABLE user_permissions (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    permissions JSONB NOT NULL
);

-- Create peak_hours table
CREATE TABLE peak_hours (
    id SERIAL PRIMARY KEY,
    day VARCHAR(50) NOT NULL,
    hour VARCHAR(100) NOT NULL,
    orders INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert some sample users
INSERT INTO users (full_name, username, email, password_hash, role, phone_number) VALUES
('سعيد خير الله', 'admin', 'admin@example.com', 'admin', 'system_admin', '967777123456'),
('فاطمة علي', 'fatima', 'fatima@example.com', '12345', 'employee', '967777123457');
