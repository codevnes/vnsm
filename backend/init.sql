-- Tạo cơ sở dữ liệu nếu chưa tồn tại
CREATE DATABASE IF NOT EXISTS vsmi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tạo người dùng với plugin xác thực mysql_native_password
CREATE USER IF NOT EXISTS 'vsmi'@'%' IDENTIFIED WITH mysql_native_password BY 'Timem.2302';
GRANT ALL PRIVILEGES ON vsmi_db.* TO 'vsmi'@'%';

-- Đảm bảo quyền được áp dụng
FLUSH PRIVILEGES;