#!/bin/sh

# Đợi MySQL khởi động
echo "Đợi MySQL khởi động..."
i=1
while [ $i -le 60 ]; do
  if mysql -h mysql -u root -pTimem.2302 -e "SELECT 1" >/dev/null 2>&1; then
    echo "MySQL đã sẵn sàng!"
    break
  fi
  echo "Đang đợi MySQL khởi động... ($i/60)"
  i=$((i+1))
  sleep 5
done

# Thêm thời gian chờ thêm để đảm bảo MySQL hoàn toàn sẵn sàng
echo "Đợi thêm 10 giây để đảm bảo MySQL hoàn toàn sẵn sàng..."
sleep 10

# Đảm bảo Prisma client được tạo đúng cho môi trường hiện tại
echo "Tạo lại Prisma client cho môi trường hiện tại..."
npx prisma generate

# Chạy Prisma migrate để đảm bảo cơ sở dữ liệu được tạo đúng cách
echo "Chạy Prisma migrate..."
# Kiểm tra xem cơ sở dữ liệu đã có bảng chưa
if mysql -h mysql -u root -pTimem.2302 -e "USE ${DB_NAME:-vsmi_db}; SHOW TABLES;" | grep -q "users"; then
  echo "Cơ sở dữ liệu đã có dữ liệu, bỏ qua migrate..."
else
  echo "Cơ sở dữ liệu trống, thực hiện migrate..."
  npx prisma migrate deploy
fi

# Chạy Prisma seed để tạo dữ liệu mẫu
echo "Chạy Prisma seed..."
npx prisma db seed

# Khởi động ứng dụng
echo "Khởi động ứng dụng..."
npm start