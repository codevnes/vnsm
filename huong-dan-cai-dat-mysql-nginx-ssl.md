# Hướng dẫn cài đặt MySQL, phpMyAdmin với Nginx và cấu hình SSL cho db.vsmi.vn

Tài liệu này hướng dẫn chi tiết các bước cài đặt MySQL, phpMyAdmin với Nginx và cấu hình SSL trên Ubuntu cho tên miền db.vsmi.vn.

## Mục lục

1. [Cài đặt MySQL Server](#1-cài-đặt-mysql-server)
2. [Bảo mật MySQL](#2-bảo-mật-mysql)
3. [Cài đặt Nginx và PHP-FPM](#3-cài-đặt-nginx-và-php-fpm)
4. [Cài đặt phpMyAdmin](#4-cài-đặt-phpmyadmin)
5. [Cấu hình Nginx cho phpMyAdmin](#5-cấu-hình-nginx-cho-phpmyadmin)
6. [Cấu hình DNS cho tên miền](#6-cấu-hình-dns-cho-tên-miền)
7. [Cài đặt SSL với Let's Encrypt](#7-cài-đặt-ssl-với-lets-encrypt)
8. [Bảo mật phpMyAdmin](#8-bảo-mật-phpmyadmin)
9. [Tối ưu hóa cấu hình SSL/TLS](#9-tối-ưu-hóa-cấu-hình-ssltls)
10. [Cấu hình tường lửa](#10-cấu-hình-tường-lửa)
11. [Xử lý sự cố thường gặp](#11-xử-lý-sự-cố-thường-gặp)

## 1. Cài đặt MySQL Server

### 1.1. Cập nhật hệ thống

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.2. Cài đặt MySQL Server

```bash
sudo apt install mysql-server -y
```

### 1.3. Kiểm tra trạng thái MySQL

```bash
sudo systemctl status mysql
```

Nếu MySQL đang chạy, bạn sẽ thấy thông báo "active (running)".

## 2. Bảo mật MySQL

### 2.1. Chạy script bảo mật MySQL

```bash
sudo mysql_secure_installation
```

Trong quá trình này, bạn sẽ được hỏi:
- Thiết lập VALIDATE PASSWORD PLUGIN (tùy chọn)
- Đặt mật khẩu cho tài khoản root
- Xóa người dùng ẩn danh
- Vô hiệu hóa đăng nhập root từ xa
- Xóa cơ sở dữ liệu test
- Tải lại bảng đặc quyền

### 2.2. Đăng nhập vào MySQL

```bash
sudo mysql
```

### 2.3. Tạo người dùng mới và cấp quyền

```sql
CREATE USER 'newuser'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON *.* TO 'newuser'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;
EXIT;
```

Thay `'newuser'` và `'password'` bằng tên người dùng và mật khẩu bạn muốn.

## 3. Cài đặt Nginx và PHP-FPM

### 3.1. Cài đặt Nginx

```bash
sudo apt install nginx -y
```

### 3.2. Cài đặt PHP-FPM và các extension cần thiết

```bash
sudo apt install php-fpm php-mysql php-mbstring php-zip php-gd php-json php-curl -y
```

### 3.3. Kiểm tra phiên bản PHP-FPM đã cài đặt

```bash
ls /var/run/php/
```

Ghi nhớ tên socket PHP-FPM (ví dụ: `php8.3-fpm.sock`) để sử dụng trong cấu hình Nginx.

### 3.4. Kiểm tra trạng thái Nginx

```bash
sudo systemctl status nginx
```

## 4. Cài đặt phpMyAdmin

### 4.1. Cài đặt phpMyAdmin

```bash
sudo apt install phpmyadmin -y
```

Trong quá trình cài đặt:
1. Khi được hỏi về web server, **không chọn** bất kỳ tùy chọn nào vì chúng ta đang sử dụng Nginx (không phải Apache). Nhấn Tab và Enter để tiếp tục.
2. Khi được hỏi về việc cấu hình database cho phpMyAdmin với dbconfig-common, chọn **Yes**.
3. Nhập mật khẩu cho người dùng phpmyadmin trong MySQL.

## 5. Cấu hình Nginx cho phpMyAdmin

### 5.1. Tạo file cấu hình Nginx cho phpMyAdmin

```bash
sudo nano /etc/nginx/conf.d/phpmyadmin.conf
```

### 5.2. Thêm cấu hình sau vào file

```nginx
server {
    listen 80;
    server_name db.vsmi.vn;  # Sử dụng tên miền db.vsmi.vn

    root /usr/share/phpmyadmin;
    index index.php index.html index.htm;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;  # Thay đổi phiên bản PHP nếu cần
    }

    location ~ /\.ht {
        deny all;
    }
}
```

**Lưu ý**: Thay `php8.3-fpm.sock` bằng phiên bản PHP mà bạn đã cài đặt.

### 5.3. Kiểm tra cấu hình Nginx

```bash
sudo nginx -t
```

### 5.4. Khởi động lại Nginx

```bash
sudo systemctl restart nginx
```

### 5.5. Kiểm tra truy cập phpMyAdmin

Mở trình duyệt web và truy cập:

```
http://your_server_ip
```

hoặc nếu bạn đã cấu hình DNS:

```
http://db.vsmi.vn
```

## 6. Cấu hình DNS cho tên miền

Để sử dụng tên miền db.vsmi.vn thay vì địa chỉ IP, bạn cần cấu hình DNS.

### 6.1. Trỏ tên miền db.vsmi.vn đến địa chỉ IP của máy chủ

Đăng nhập vào trang quản lý DNS của nhà cung cấp tên miền vsmi.vn và thêm bản ghi A:
- Tên: db
- Giá trị: [Địa chỉ IP của máy chủ Ubuntu]
- TTL: 3600 (hoặc giá trị mặc định)

### 6.2. Cập nhật cấu hình Nginx với tên miền db.vsmi.vn

```bash
sudo nano /etc/nginx/conf.d/phpmyadmin.conf
```

Thay đổi `server_name localhost;` thành:

```nginx
server_name db.vsmi.vn;
```

### 6.3. Kiểm tra và khởi động lại Nginx

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 7. Cài đặt SSL với Let's Encrypt

### 7.1. Cài đặt Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 7.2. Lấy chứng chỉ SSL cho db.vsmi.vn

```bash
sudo certbot --nginx -d db.vsmi.vn
```

Certbot sẽ hỏi bạn một số câu hỏi:
1. Nhập địa chỉ email của bạn (để nhận thông báo về việc gia hạn chứng chỉ)
2. Đồng ý với điều khoản dịch vụ
3. Chọn có hoặc không chia sẻ email với EFF
4. Chọn có hoặc không chuyển hướng HTTP sang HTTPS (khuyến nghị chọn có)

### 7.3. Kiểm tra cấu hình SSL

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 7.4. Kiểm tra tự động gia hạn chứng chỉ

```bash
sudo certbot renew --dry-run
```

## 8. Bảo mật phpMyAdmin

### 8.1. Thiết lập xác thực HTTP Basic

#### 8.1.1. Cài đặt apache2-utils

```bash
sudo apt install apache2-utils -y
```

#### 8.1.2. Tạo file mật khẩu

```bash
sudo htpasswd -c /etc/nginx/.htpasswd admin  # Thay 'admin' bằng tên người dùng bạn muốn
```

#### 8.1.3. Cập nhật cấu hình Nginx

```bash
sudo nano /etc/nginx/conf.d/phpmyadmin.conf
```

Tìm block `location /` trong cấu hình server HTTPS và thêm cấu hình xác thực:

```nginx
location / {
    try_files $uri $uri/ =404;
    auth_basic "Restricted Access";
    auth_basic_user_file /etc/nginx/.htpasswd;
}
```

#### 8.1.4. Kiểm tra và khởi động lại Nginx

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 8.2. Giới hạn truy cập theo IP (tùy chọn)

Nếu bạn muốn giới hạn truy cập phpMyAdmin chỉ từ một số địa chỉ IP cụ thể:

```bash
sudo nano /etc/nginx/conf.d/phpmyadmin.conf
```

Tìm block `location /` và thêm cấu hình giới hạn IP:

```nginx
location / {
    try_files $uri $uri/ =404;
    auth_basic "Restricted Access";
    auth_basic_user_file /etc/nginx/.htpasswd;
    
    # Chỉ cho phép các IP cụ thể
    allow 192.168.1.100;  # Thay bằng IP của bạn
    allow 10.0.0.1;       # Thêm nhiều IP nếu cần
    deny all;             # Từ chối tất cả các IP khác
}
```

## 9. Tối ưu hóa cấu hình SSL/TLS

### 9.1. Cập nhật cấu hình SSL trong Nginx

```bash
sudo nano /etc/nginx/conf.d/phpmyadmin.conf
```

### 9.2. Thêm các cấu hình SSL tối ưu

Thêm các dòng sau vào block server HTTPS (thường là sau dòng `server_name`):

```nginx
# Cấu hình SSL tối ưu
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_session_tickets off;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# Thêm HSTS
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

# Các header bảo mật khác
add_header X-Content-Type-Options nosniff;
add_header X-Frame-Options SAMEORIGIN;
add_header X-XSS-Protection "1; mode=block";
```

### 9.3. Kiểm tra và khởi động lại Nginx

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 10. Cấu hình tường lửa

### 10.1. Cài đặt UFW

```bash
sudo apt install ufw -y
```

### 10.2. Cấu hình các quy tắc tường lửa

```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 10.3. Kiểm tra trạng thái tường lửa

```bash
sudo ufw status
```

## 11. Xử lý sự cố thường gặp

### 11.1. Không thể kết nối đến MySQL

Kiểm tra trạng thái MySQL:

```bash
sudo systemctl status mysql
```

Nếu MySQL không chạy, khởi động lại:

```bash
sudo systemctl restart mysql
```

### 11.2. Lỗi "Access denied" khi đăng nhập vào phpMyAdmin

#### 11.2.1. Kiểm tra người dùng MySQL

```bash
sudo mysql
SELECT user, host FROM mysql.user;
```

#### 11.2.2. Đặt lại mật khẩu cho người dùng

```sql
ALTER USER 'username'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

#### 11.2.3. Đặt lại mật khẩu root MySQL

Nếu bạn quên mật khẩu root MySQL, bạn có thể đặt lại bằng cách sau:

##### Phương pháp 1: Sử dụng mysqld_safe (MySQL 8.0+)

1. Dừng dịch vụ MySQL:
```bash
sudo systemctl stop mysql
```

2. Khởi động MySQL ở chế độ bỏ qua kiểm tra quyền:
```bash
sudo mysqld_safe --skip-grant-tables --skip-networking &
```

3. Kết nối đến MySQL mà không cần mật khẩu:
```bash
mysql -u root
```

4. Đặt lại mật khẩu root (cho MySQL 8.0+):
```sql
USE mysql;
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'new_password';
FLUSH PRIVILEGES;
EXIT;
```

5. Dừng và khởi động lại MySQL:
```bash
sudo killall mysqld
sudo systemctl start mysql
```

6. Kiểm tra đăng nhập với mật khẩu mới:
```bash
mysql -u root -p
```

##### Phương pháp 2: Sử dụng systemd (Khuyến nghị cho Ubuntu 22.04)

1. Dừng dịch vụ MySQL:
```bash
sudo systemctl stop mysql
```

2. Chỉnh sửa file cấu hình systemd của MySQL:
```bash
sudo systemctl edit mysql
```

3. Thêm các dòng sau vào file:
```ini
[Service]
ExecStart=
ExecStart=/usr/sbin/mysqld --skip-grant-tables --skip-networking
```

4. Khởi động lại MySQL:
```bash
sudo systemctl daemon-reload
sudo systemctl start mysql
```

5. Kết nối đến MySQL mà không cần mật khẩu:
```bash
mysql -u root
```

6. Đặt lại mật khẩu root:
```sql
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'Timem.2302';
EXIT;
```

7. Xóa cấu hình tạm thời và khởi động lại MySQL:
```bash
sudo systemctl edit mysql
```
(Xóa nội dung file và lưu lại)

```bash
sudo systemctl daemon-reload
sudo systemctl restart mysql
```

8. Kiểm tra đăng nhập với mật khẩu mới:
```bash
mysql -u root -p
```

#### 11.2.4. Kiểm tra phương thức xác thực của người dùng root

Trong MySQL 8.0+, phương thức xác thực mặc định đã thay đổi. Kiểm tra phương thức xác thực:

```bash
sudo mysql
SELECT user, host, plugin FROM mysql.user WHERE user='root';
```

Nếu plugin là `auth_socket` hoặc `caching_sha2_password`, bạn có thể thay đổi thành `mysql_native_password` để tương thích với phpMyAdmin:

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

### 11.3. Lỗi 502 Bad Gateway

Kiểm tra trạng thái PHP-FPM:

```bash
sudo systemctl status php8.3-fpm  # Thay đổi phiên bản PHP nếu cần
```

Nếu PHP-FPM không chạy, khởi động lại:

```bash
sudo systemctl restart php8.3-fpm  # Thay đổi phiên bản PHP nếu cần
```

Kiểm tra logs:

```bash
sudo tail -f /var/log/nginx/error.log
```

### 11.4. Chứng chỉ SSL hết hạn

Gia hạn chứng chỉ SSL:

```bash
sudo certbot renew
```

### 11.5. Kiểm tra cấu hình Nginx

```bash
sudo nginx -t
```

## Cấu hình hoàn chỉnh tham khảo

Dưới đây là một ví dụ về cấu hình Nginx hoàn chỉnh cho phpMyAdmin với SSL cho tên miền db.vsmi.vn:

```nginx
server {
    listen 80;
    server_name db.vsmi.vn;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name db.vsmi.vn;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/db.vsmi.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/db.vsmi.vn/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Cấu hình SSL tối ưu
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;
    
    # Thêm HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    
    # Các header bảo mật khác
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";
    
    root /usr/share/phpmyadmin;
    index index.php index.html index.htm;
    
    location / {
        try_files $uri $uri/ =404;
        auth_basic "Restricted Access";
        auth_basic_user_file /etc/nginx/.htpasswd;
        
        # Tùy chọn: Giới hạn truy cập theo IP
        # allow 192.168.1.100;
        # deny all;
    }
    
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
    }
    
    location ~ /\.ht {
        deny all;
    }
}
```

---

## Kết luận

Bạn đã hoàn thành việc cài đặt MySQL, phpMyAdmin với Nginx và cấu hình SSL. Hệ thống của bạn bây giờ đã sẵn sàng để quản lý cơ sở dữ liệu MySQL một cách an toàn và bảo mật.

Để đảm bảo hệ thống luôn an toàn, hãy nhớ:
- Cập nhật thường xuyên: `sudo apt update && sudo apt upgrade -y`
- Theo dõi các bản vá bảo mật cho MySQL, Nginx và phpMyAdmin
- Sao lưu cơ sở dữ liệu thường xuyên