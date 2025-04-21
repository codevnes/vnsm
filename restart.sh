#!/bin/bash

# Dừng và xóa các container hiện tại
echo "Dừng và xóa các container hiện tại..."
docker-compose down

# Xóa volume MySQL để đảm bảo cấu hình mới được áp dụng
echo "Xóa volume MySQL..."
docker volume rm vnsm_mysql-data || true

# Khởi động lại các container
echo "Khởi động lại các container..."
docker-compose up -d

# Hiển thị logs của container backend
echo "Hiển thị logs của container backend..."
docker-compose logs -f backend