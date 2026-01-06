-- =============================================
-- Database: electricity_db
-- Electricity Bill Backend Demo
-- =============================================

-- Create database
CREATE DATABASE IF NOT EXISTS electricity_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE electricity_db;

-- =============================================
-- Table: users
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(15) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone)
) ENGINE=InnoDB;

-- =============================================
-- Table: bills
-- =============================================
CREATE TABLE IF NOT EXISTS bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(15) NOT NULL,
    month VARCHAR(10) NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_code VARCHAR(20) NOT NULL,
    kwh INT NOT NULL,
    amount INT NOT NULL,
    due_dates VARCHAR(50),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_phone (phone),
    INDEX idx_month (month)
) ENGINE=InnoDB;

-- =============================================
-- Table: sms_queue
-- =============================================
CREATE TABLE IF NOT EXISTS sms_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(15) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP NULL,
    INDEX idx_status (status),
    INDEX idx_phone (phone)
) ENGINE=InnoDB;

-- =============================================
-- Table: otp_codes (for password reset)
-- =============================================
CREATE TABLE IF NOT EXISTS otp_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(15) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_phone_code (phone, code)
) ENGINE=InnoDB;

-- =============================================
-- Sample Data: Users
-- Password: 123456 (bcrypt hash)
-- =============================================
INSERT INTO users (phone, password, name, role) VALUES
('0982956188', '$2a$10$rQnM1F.dJpNl5G7hN5KJxOqJQ5H5vKPL5XvXfJdL5vL5vKPL5XvXf', 'Nguyễn Hữu Hà-Thái', 'user'),
('0968587259', '$2a$10$rQnM1F.dJpNl5G7hN5KJxOqJQ5H5vKPL5XvXfJdL5vL5vKPL5XvXf', 'Phí Thị Thơi-Đào', 'user'),
('0342066639', '$2a$10$rQnM1F.dJpNl5G7hN5KJxOqJQ5H5vKPL5XvXfJdL5vL5vKPL5XvXf', 'Nguyễn Văn Mạnh-KD', 'user'),
('0585913333', '$2a$10$rQnM1F.dJpNl5G7hN5KJxOqJQ5H5vKPL5XvXfJdL5vL5vKPL5XvXf', 'Chu Đình Chỉnh-KD', 'user'),
('0367104855', '$2a$10$rQnM1F.dJpNl5G7hN5KJxOqJQ5H5vKPL5XvXfJdL5vL5vKPL5XvXf', 'Nguyễn Thị Uyên-KD', 'user'),
('0979761838', '$2a$10$rQnM1F.dJpNl5G7hN5KJxOqJQ5H5vKPL5XvXfJdL5vL5vKPL5XvXf', 'Nguyễn Thị Sơn-Nhà Nghỉ 86', 'user'),
('0374766188', '$2a$10$rQnM1F.dJpNl5G7hN5KJxOqJQ5H5vKPL5XvXfJdL5vL5vKPL5XvXf', 'Nguyễn Thị Nhàn-Thanh', 'user'),
('0965453253', '$2a$10$rQnM1F.dJpNl5G7hN5KJxOqJQ5H5vKPL5XvXfJdL5vL5vKPL5XvXf', 'Nguyễn Văn Nhượng', 'user'),
('admin', '$2a$10$rQnM1F.dJpNl5G7hN5KJxOqJQ5H5vKPL5XvXfJdL5vL5vKPL5XvXf', 'Admin', 'admin');

-- =============================================
-- Sample Data: Bills
-- =============================================
INSERT INTO bills (phone, month, customer_name, customer_code, kwh, amount, due_dates, content) VALUES
('0982956188', '12/2025', 'Nguyễn Hữu Hà-Thái', 'T1.002', 98, 213408, '25,26,27/7', 'HTX Dong Tien thong bao: so dien tieu thu ma khach hang T1.002 Thang 7 la 98 kWh va so Tien tam tinh la 213.408 dong. Ngay nop 25,26,27/7'),
('0968587259', '12/2025', 'Phí Thị Thơi-Đào', 'T1.003', 554, 1735927, '25,26,27/7', 'HTX Dong Tien thong bao: so dien tieu thu ma khach hang T1.003 Thang 7 la 554 kWh va so Tien tam tinh la 1.735.927 dong. Ngay nop 25,26,27/7'),
('0342066639', '12/2025', 'Nguyễn Văn Mạnh-KD', 'T1.004', 80, 272333, '25,26,27/7', 'HTX Dong Tien thong bao: so dien tieu thu ma khach hang T1.004 Thang 7 la 80 kWh va so Tien tam tinh la 272.333 dong. Ngay nop 25,26,27/7'),
('0585913333', '12/2025', 'Chu Đình Chỉnh-KD', 'T1.005', 42, 142975, '25,26,27/7', 'HTX Dong Tien thong bao: so dien tieu thu ma khach hang T1.005 Thang 7 la 42 kWh va so Tien tam tinh la 142.975 dong. Ngay nop 25,26,27/7'),
('0367104855', '12/2025', 'Nguyễn Thị Uyên-KD', 'T1.006', 335, 1140394, '25,26,27/7', 'HTX Dong Tien thong bao: so dien tieu thu ma khach hang T1.006 Thang 7 la 335 kWh va so Tien tam tinh la 1.140.394 dong. Ngay nop 25,26,27/7'),
('0979761838', '12/2025', 'Nguyễn Thị Sơn-Nhà Nghỉ 86', 'T1.008', 745, 2536099, '25,26,27/7', 'HTX Dong Tien thong bao: so dien tieu thu ma khach hang T1.008 Thang 7 la 745 kWh va so Tien tam tinh la 2.536.099 dong. Ngay nop 25,26,27/7'),
('0374766188', '12/2025', 'Nguyễn Thị Nhàn-Thanh', 'T1.009', 187, 441461, '25,26,27/7', 'HTX Dong Tien thong bao: so dien tieu thu ma khach hang T1.009 Thang 7 la 187 kWh va so Tien tam tinh la 441.461 dong. Ngay nop 25,26,27/7'),
('0965453253', '12/2025', 'Nguyễn Văn Nhượng', 'T1.011.02', 245, 620579, '25,26,27/7', 'HTX Dong Tien thong bao: so dien tieu thu ma khach hang T1.011.02 Thang 7 la 245 kWh va so Tien tam tinh la 620.579 dong. Ngay nop 25,26,27/7');

-- =============================================
-- Sample Data: SMS Queue (pending)
-- =============================================
INSERT INTO sms_queue (phone, message, status) VALUES
('0982956188', 'HTX Dong Tien thong bao: Tien dien thang 12/2025 cua ban la 213.408 dong. Vui long thanh toan truoc ngay 27/12.', 'pending'),
('0968587259', 'HTX Dong Tien thong bao: Tien dien thang 12/2025 cua ban la 1.735.927 dong. Vui long thanh toan truoc ngay 27/12.', 'pending');
