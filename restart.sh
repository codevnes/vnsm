#!/bin/bash

# Mặc định không reset database
RESET_DB=false

# Xử lý tham số dòng lệnh
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --reset-db|--reset-database|-r)
            RESET_DB=true
            ;;
        --help|-h)
            echo "Sử dụng: $0 [tùy chọn]"
            echo "Tùy chọn:"
            echo "  --reset-db, --reset-database, -r    Reset database (xóa volume MySQL)"
            echo "  --help, -h                          Hiển thị trợ giúp này"
            exit 0
            ;;
        *)
            echo "Tùy chọn không hợp lệ: $1"
            echo "Sử dụng --help để xem các tùy chọn hợp lệ"
            exit 1
            ;;
    esac
    shift
done

# Dừng và xóa các container hiện tại
echo "Dừng và xóa các container hiện tại..."
docker-compose down

# Xóa volume MySQL nếu được yêu cầu
if [ "$RESET_DB" = true ]; then
    echo "Xóa volume MySQL để reset database..."
    docker volume rm vnsm_mysql-data || true
else
    echo "Giữ nguyên database hiện tại..."
fi

# Xóa các image để đảm bảo rằng chúng được xây dựng lại
echo "Xóa các image..."
docker rmi $(docker images -q vnsm-backend) || true
docker rmi $(docker images -q vnsm-frontend) || true

# Tạo Prisma client với binaryTargets đúng
echo "Tạo Prisma client..."
cd backend && npx prisma generate && cd ..

# Khởi động lại các container
echo "Khởi động lại các container..."
docker-compose up -d --build

# Đợi MySQL khởi động
echo "Đợi MySQL khởi động..."
sleep 15

# Hiển thị logs của container backend
echo "Hiển thị logs của container backend..."
docker-compose logs -f backend