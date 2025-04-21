#!/bin/sh

# Đợi MySQL khởi động
echo "Đợi MySQL khởi động..."
sleep 10

# Chạy Prisma migrate để đảm bảo cơ sở dữ liệu được tạo đúng cách
echo "Chạy Prisma migrate..."
npx prisma migrate deploy

# Chạy Prisma seed để tạo dữ liệu mẫu
echo "Chạy Prisma seed..."
npx prisma db seed

# Khởi động ứng dụng
echo "Khởi động ứng dụng..."
npm start