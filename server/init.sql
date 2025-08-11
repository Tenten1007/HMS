-- HMS Database Schema
-- สร้าง tables สำหรับระบบจัดการหอพัก

-- Table: rooms (ห้องพัก)
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: tenants (ผู้เช่า)
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    start_date DATE NOT NULL,
    end_date DATE,
    note TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: bills (ใบแจ้งหนี้)
CREATE TABLE IF NOT EXISTS bills (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    room_rate DECIMAL(10,2) DEFAULT 0,
    water_prev DECIMAL(10,2) DEFAULT 0,
    water_curr DECIMAL(10,2) DEFAULT 0,
    water_used DECIMAL(10,2) DEFAULT 0,
    water_rate DECIMAL(10,2) DEFAULT 0,
    electric_prev DECIMAL(10,2) DEFAULT 0,
    electric_curr DECIMAL(10,2) DEFAULT 0,
    electric_used DECIMAL(10,2) DEFAULT 0,
    electric_rate DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    paid_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(room_id, month, year)
);

-- Table: payments (การชำระเงิน)
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    bill_id INTEGER REFERENCES bills(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(50),
    slip_url TEXT,
    note TEXT,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample data
-- ห้องพัก
INSERT INTO rooms (name) VALUES 
    ('ห้อง 101'),
    ('ห้อง 102'),
    ('ห้อง 103'),
    ('ห้อง 104'),
    ('ห้อง 105')
ON CONFLICT DO NOTHING;

-- ผู้เช่า
INSERT INTO tenants (room_id, name, phone, start_date, note) VALUES 
    (2, 'สมชาย ใจดี', '081-234-5678', '2024-01-01', 'จ่ายตรงเวลา')
ON CONFLICT DO NOTHING;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bills_room_id ON bills(room_id);
CREATE INDEX IF NOT EXISTS idx_bills_month_year ON bills(month, year);
CREATE INDEX IF NOT EXISTS idx_tenants_room_id ON tenants(room_id);
CREATE INDEX IF NOT EXISTS idx_payments_bill_id ON payments(bill_id);