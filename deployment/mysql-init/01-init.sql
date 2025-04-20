-- Thiết lập bộ ký tự UTF-8 mặc định
SET NAMES utf8mb4;
SET character_set_client = utf8mb4;

-- Tạo cơ sở dữ liệu nếu chưa tồn tại
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Sử dụng cơ sở dữ liệu
USE ${DB_NAME};

-- Thiết lập quyền cho người dùng
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'%';
FLUSH PRIVILEGES;

-- Đặt múi giờ
SET GLOBAL time_zone = '+07:00';
SET time_zone = '+07:00';

-- Các thiết lập bổ sung có thể được thêm vào đây
-- Ví dụ: tạo bảng mặc định, thêm dữ liệu ban đầu, v.v. 