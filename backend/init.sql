-- Tạo cơ sở dữ liệu nếu chưa tồn tại
CREATE DATABASE IF NOT EXISTS vsmi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Đảm bảo quyền được áp dụng
FLUSH PRIVILEGES;

-- Sử dụng cơ sở dữ liệu vsmi_db
USE vsmi_db;

-- Tạo bảng users nếu chưa tồn tại
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'editor', 'user') DEFAULT 'user',
  thumbnail VARCHAR(255),
  verified BOOLEAN DEFAULT FALSE
);