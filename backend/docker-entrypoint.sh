#!/bin/sh

# Đợi MySQL khởi động
echo "Đợi MySQL khởi động..."
i=1
while [ $i -le 30 ]; do
  if mysqladmin ping -h mysql -u root -pTimem.2302 --silent; then
    echo "MySQL đã sẵn sàng!"
    break
  fi
  echo "Đang đợi MySQL khởi động... ($i/30)"
  i=$((i+1))
  sleep 2
done

# Đảm bảo Prisma client được tạo đúng cho môi trường hiện tại
echo "Tạo lại Prisma client cho môi trường hiện tại..."
npx prisma generate

# Chạy Prisma migrate để đảm bảo cơ sở dữ liệu được tạo đúng cách
echo "Chạy Prisma migrate..."
npx prisma migrate deploy

# Chạy Prisma seed để tạo dữ liệu mẫu
echo "Chạy Prisma seed..."
npx prisma db seed

# Khởi động ứng dụng
echo "Khởi động ứng dụng..."
npm start