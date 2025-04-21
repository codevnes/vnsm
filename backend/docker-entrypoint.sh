#!/bin/sh

# Đợi MySQL khởi động
echo "Đợi MySQL khởi động..."
for i in {1..30}; do
  if mysqladmin ping -h mysql -u root -proot --silent; then
    echo "MySQL đã sẵn sàng!"
    break
  fi
  echo "Đang đợi MySQL khởi động... ($i/30)"
  sleep 2
done

# Chạy Prisma migrate để đảm bảo cơ sở dữ liệu được tạo đúng cách
echo "Chạy Prisma migrate..."
npx prisma migrate deploy

# Chạy Prisma seed để tạo dữ liệu mẫu
echo "Chạy Prisma seed..."
npx prisma db seed

# Khởi động ứng dụng
echo "Khởi động ứng dụng..."
npm start