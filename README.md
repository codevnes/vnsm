# VNSM - Hướng dẫn sử dụng Docker

## Giới thiệu

Dự án VNSM bao gồm 3 thành phần chính:
- **Backend**: API server sử dụng Node.js, Express, TypeScript và Prisma
- **Frontend**: Ứng dụng web sử dụng Next.js và React
- **Database**: MySQL

## Yêu cầu

- Docker và Docker Compose đã được cài đặt
- Git (để clone repository)

## Cài đặt và chạy ứng dụng

### 1. Clone repository

```bash
git clone <repository-url>
cd vnsm
```

### 2. Cấu hình môi trường

Chỉnh sửa file `.env` ở thư mục gốc để thiết lập các biến môi trường:

```
# Database Configuration
DB_USER=vnsm_user
DB_PASSWORD=your_db_password
DB_NAME=vnsm_db

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d
```

### 3. Khởi động ứng dụng với Docker Compose

```bash
docker-compose up -d
```

Lệnh này sẽ:
- Tạo và khởi động container MySQL
- Build và khởi động container Backend
- Build và khởi động container Frontend

### 4. Truy cập ứng dụng

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Swagger API Documentation: http://localhost:3001/api-docs

### 5. Dừng ứng dụng

```bash
docker-compose down
```

## Quản lý dữ liệu

Dữ liệu MySQL được lưu trữ trong Docker volume `mysql_data`. Điều này đảm bảo dữ liệu của bạn không bị mất khi container bị xóa.

## Các lệnh hữu ích

### Xem logs

```bash
# Xem logs của tất cả các services
docker-compose logs

# Xem logs của một service cụ thể (backend, frontend hoặc db)
docker-compose logs backend
```

### Khởi động lại một service

```bash
docker-compose restart backend
```

### Rebuild và khởi động lại một service

```bash
docker-compose up -d --build backend
```

### Xóa tất cả containers và volumes

```bash
docker-compose down -v
```

## Troubleshooting

### Vấn đề kết nối database

Nếu backend không thể kết nối đến database, hãy đảm bảo:
1. Container MySQL đã khởi động thành công
2. Các biến môi trường DB_USER, DB_PASSWORD, DB_NAME đã được thiết lập đúng
3. Đợi một vài giây để MySQL khởi động hoàn toàn trước khi backend cố gắng kết nối

### Vấn đề với Prisma

Nếu có lỗi liên quan đến Prisma, bạn có thể cần chạy migration:

```bash
docker-compose exec backend npx prisma migrate dev
```