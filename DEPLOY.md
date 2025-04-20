# Hướng dẫn triển khai VNSM trên VPS

Tài liệu này hướng dẫn cách triển khai dự án VNSM trên VPS sử dụng Docker, Traefik và phpMyAdmin.

## Yêu cầu hệ thống

- VPS chạy Linux (Ubuntu 20.04 hoặc mới hơn được khuyến nghị)
- Đã cài đặt Git
- Có quyền sudo
- Domain đã trỏ về IP của VPS

## Các bước triển khai

### 1. Clone repository

```bash
git clone <repository-url> vnsm
cd vnsm
```

### 2. Cấp quyền thực thi cho script triển khai

```bash
chmod +x deploy.sh
```

### 3. Chạy script triển khai

```bash
./deploy.sh
```

### 4. Nhập thông tin cấu hình

Script sẽ yêu cầu bạn nhập các thông tin sau:

- **Domain chính**: Domain chính của ứng dụng (ví dụ: example.com)
- **Subdomain cho API**: Subdomain cho backend API (mặc định: api)
- **Subdomain cho phpMyAdmin**: Subdomain cho phpMyAdmin (mặc định: db)
- **Email cho Let's Encrypt**: Email để đăng ký chứng chỉ SSL
- **Thông tin cơ sở dữ liệu**: Mật khẩu root, tên database, tên người dùng và mật khẩu
- **JWT Secret**: Khóa bí mật cho JWT (mặc định: tự động tạo)
- **Môi trường triển khai**: production hoặc staging (mặc định: production)

### 5. Kiểm tra triển khai

Sau khi script chạy xong, bạn có thể truy cập các URL sau:

- **Frontend**: https://your-domain.com
- **Backend API**: https://api.your-domain.com
- **phpMyAdmin**: https://db.your-domain.com
- **Traefik Dashboard**: https://traefik.your-domain.com (username: admin, password: admin)

## Cấu trúc thư mục sau khi triển khai

```
vnsm/
├── backend/
│   ├── Dockerfile
│   └── ...
├── frontend/
│   ├── Dockerfile
│   └── ...
├── docker/
│   ├── traefik/
│   │   ├── config/
│   │   │   └── traefik.yml
│   │   └── letsencrypt/
│   └── mysql/
│       ├── data/
│       └── init/
├── docker-compose.yml
├── deploy.sh
└── DEPLOY.md
```

## Quản lý ứng dụng

### Xem logs

```bash
# Xem logs của tất cả các container
docker-compose logs

# Xem logs của một container cụ thể
docker-compose logs backend
docker-compose logs frontend
```

### Khởi động lại ứng dụng

```bash
docker-compose restart
```

### Cập nhật ứng dụng

```bash
# Pull code mới
git pull

# Rebuild và khởi động lại các container
docker-compose up -d --build
```

### Dừng ứng dụng

```bash
docker-compose down
```

## Xử lý sự cố

### Kiểm tra trạng thái các container

```bash
docker-compose ps
```

### Kiểm tra logs

```bash
docker-compose logs -f
```

### Kiểm tra cấu hình Traefik

```bash
docker-compose exec traefik traefik healthcheck
```

### Khởi động lại một container cụ thể

```bash
docker-compose restart <container-name>
```

## Bảo mật

- Thay đổi mật khẩu mặc định cho Traefik Dashboard trong file docker-compose.yml
- Đảm bảo firewall chỉ mở các cổng 80 và 443
- Cân nhắc sử dụng VPN hoặc IP whitelist cho phpMyAdmin và Traefik Dashboard

## Sao lưu dữ liệu

### Sao lưu cơ sở dữ liệu

```bash
docker-compose exec mysql mysqldump -u root -p<password> <database> > backup.sql
```

### Khôi phục cơ sở dữ liệu

```bash
cat backup.sql | docker-compose exec -T mysql mysql -u root -p<password> <database>
```