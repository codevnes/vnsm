#!/bin/bash

# Dừng và xóa các container hiện tại
echo "Dừng và xóa các container hiện tại..."
docker-compose down

# Xóa volume MySQL để đảm bảo cấu hình mới được áp dụng
echo "Xóa volume MySQL..."
docker volume rm vnsm_mysql-data || true

# Xóa các image để đảm bảo rằng chúng được xây dựng lại
echo "Xóa các image..."
docker rmi $(docker images -q vnsm-backend) || true
docker rmi $(docker images -q vnsm-frontend) || true

# Khởi động lại các container
echo "Khởi động lại các container..."
docker-compose up -d --build

# Đợi MySQL khởi động
echo "Đợi MySQL khởi động..."
sleep 10

# Hiển thị logs của container backend
echo "Hiển thị logs của container backend..."
docker-compose logs -f backend