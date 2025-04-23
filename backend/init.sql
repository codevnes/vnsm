-- Tạo cơ sở dữ liệu nếu chưa tồn tại
CREATE DATABASE IF NOT EXISTS vsmi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Đảm bảo quyền được áp dụng
FLUSH PRIVILEGES;

-- Sử dụng cơ sở dữ liệu vsmi_db
USE vsmi_db;
