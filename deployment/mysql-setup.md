# Hướng dẫn chuyển dữ liệu MySQL vào Docker

Hướng dẫn này giúp bạn sao lưu cơ sở dữ liệu MySQL từ máy cục bộ và khôi phục vào container Docker.

## 1. Sao lưu dữ liệu từ MySQL local

### 1.1. Sao lưu toàn bộ dữ liệu

```bash
# Trên máy cục bộ
mkdir -p /đường_dẫn/đến/backup
mysqldump -u root -p --all-databases > /đường_dẫn/đến/backup/full_backup.sql
# Nén file để tiết kiệm dung lượng
gzip /đường_dẫn/đến/backup/full_backup.sql
```

### 1.2. Sao lưu một cơ sở dữ liệu cụ thể

```bash
# Trên máy cục bộ
mysqldump -u root -p tên_database > /đường_dẫn/đến/backup/database_backup.sql
# Nén file
gzip /đường_dẫn/đến/backup/database_backup.sql
```

## 2. Chuyển file sao lưu vào máy chủ

### 2.1. Sử dụng SCP

```bash
scp /đường_dẫn/đến/backup/database_backup.sql.gz user@your-server:/opt/vnsm.vn/deployment/backup/
```

### 2.2. Hoặc tải lên thông qua giao diện quản lý máy chủ

Đưa file sao lưu vào thư mục `/opt/vnsm.vn/deployment/backup/` trên máy chủ.

## 3. Khôi phục dữ liệu vào Docker

### 3.1. Khôi phục sử dụng script có sẵn

```bash
# Trên máy chủ
cd /opt/vnsm.vn/deployment
docker exec -it vnsm-db /backup/restore.sh database_backup.sql.gz
```

### 3.2. Hoặc khôi phục thủ công

```bash
# Trên máy chủ
cd /opt/vnsm.vn/deployment
# Giải nén file backup
gunzip -c backup/database_backup.sql.gz > backup/database_backup.sql
# Khôi phục vào container
docker exec -i vnsm-db mysql -u root -p$DB_ROOT_PASSWORD < backup/database_backup.sql
```

## 4. Xử lý sự cố

### 4.1. Lỗi về quyền truy cập file

```bash
# Cấp quyền cho thư mục backup
sudo chown -R 999:999 /opt/vnsm.vn/deployment/backup
```

### 4.2. Lỗi khi khôi phục

Nếu gặp lỗi khi khôi phục, hãy kiểm tra:

- Phiên bản MySQL trên máy cục bộ và trong Docker
- Cấu trúc bảng và bộ ký tự (charset)
- Quyền người dùng

```bash
# Kiểm tra phiên bản MySQL trong container
docker exec -it vnsm-db mysql -V

# Kiểm tra logs
docker logs vnsm-db
```

## 5. Kiểm tra dữ liệu

Sau khi khôi phục, hãy truy cập Adminer tại `https://db.yourdomain.com` để kiểm tra dữ liệu đã được khôi phục đúng chưa.

## 6. Tự động hóa sao lưu

Thiết lập sao lưu tự động hàng ngày:

```bash
# Thêm vào crontab
crontab -e

# Thêm dòng sau để sao lưu hàng ngày lúc 2 giờ sáng
0 2 * * * cd /opt/vnsm.vn/deployment && docker exec vnsm-db /backup/backup.sh
``` 