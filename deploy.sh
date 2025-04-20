#!/bin/bash

# Script triển khai dự án VNSM trên VPS sử dụng Docker và Traefik
# Tự động cấu hình domain và SSL

# Màu sắc cho output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Hàm hiển thị thông báo
print_message() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Kiểm tra xem Docker đã được cài đặt chưa
check_docker() {
  if ! command -v docker &> /dev/null; then
    print_error "Docker chưa được cài đặt. Đang cài đặt Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    print_message "Docker đã được cài đặt thành công!"
  else
    print_message "Docker đã được cài đặt."
  fi

  if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose chưa được cài đặt. Đang cài đặt Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.6/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_message "Docker Compose đã được cài đặt thành công!"
  else
    print_message "Docker Compose đã được cài đặt."
  fi
}

# Yêu cầu thông tin cấu hình
get_config() {
  # Domain chính
  read -p "Nhập domain chính (ví dụ: example.com): " DOMAIN
  if [ -z "$DOMAIN" ]; then
    print_error "Domain không được để trống!"
    exit 1
  fi

  # Subdomain cho API
  read -p "Nhập subdomain cho API (mặc định: api): " API_SUBDOMAIN
  API_SUBDOMAIN=${API_SUBDOMAIN:-api}
  
  # Subdomain cho phpMyAdmin
  read -p "Nhập subdomain cho phpMyAdmin (mặc định: db): " PMA_SUBDOMAIN
  PMA_SUBDOMAIN=${PMA_SUBDOMAIN:-db}
  
  # Email cho Let's Encrypt
  read -p "Nhập email cho Let's Encrypt: " EMAIL
  if [ -z "$EMAIL" ]; then
    print_error "Email không được để trống!"
    exit 1
  fi
  
  # Thông tin cơ sở dữ liệu
  read -p "Nhập mật khẩu cho MySQL root (mặc định: vnsm_password): " MYSQL_ROOT_PASSWORD
  MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-vnsm_password}
  
  read -p "Nhập tên database (mặc định: vnsm_db): " MYSQL_DATABASE
  MYSQL_DATABASE=${MYSQL_DATABASE:-vnsm_db}
  
  read -p "Nhập tên người dùng database (mặc định: vnsm_user): " MYSQL_USER
  MYSQL_USER=${MYSQL_USER:-vnsm_user}
  
  read -p "Nhập mật khẩu người dùng database (mặc định: vnsm_password): " MYSQL_PASSWORD
  MYSQL_PASSWORD=${MYSQL_PASSWORD:-vnsm_password}
  
  # JWT Secret
  read -p "Nhập JWT secret (mặc định: random string): " JWT_SECRET
  JWT_SECRET=${JWT_SECRET:-$(openssl rand -hex 32)}
  
  # Môi trường
  read -p "Môi trường triển khai (production/staging, mặc định: production): " ENVIRONMENT
  ENVIRONMENT=${ENVIRONMENT:-production}
}

# Tạo thư mục cần thiết
create_directories() {
  print_message "Tạo thư mục cần thiết..."
  
  mkdir -p ./docker/traefik/config
  mkdir -p ./docker/traefik/letsencrypt
  mkdir -p ./docker/mysql/data
  mkdir -p ./docker/mysql/init
  
  print_message "Đã tạo thư mục thành công!"
}

# Tạo file docker-compose.yml
create_docker_compose() {
  print_message "Tạo file docker-compose.yml..."
  
  cat > docker-compose.yml << EOL
version: '3.8'

networks:
  traefik-network:
    name: traefik-network
  backend-network:
    name: backend-network

volumes:
  mysql_data:
    name: mysql_data
  traefik_letsencrypt:
    name: traefik_letsencrypt

services:
  # Traefik - Reverse Proxy và SSL
  traefik:
    image: traefik:v2.10
    container_name: traefik
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    networks:
      - traefik-network
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./docker/traefik/config:/etc/traefik
      - traefik_letsencrypt:/letsencrypt
    command:
      - "--api.dashboard=true"
      - "--api.insecure=false"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--providers.file.directory=/etc/traefik"
      - "--providers.file.watch=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--entrypoints.web.http.redirections.entrypoint.to=websecure"
      - "--entrypoints.web.http.redirections.entrypoint.scheme=https"
      - "--certificatesresolvers.letsencrypt.acme.email=${EMAIL}"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.traefik.rule=Host(\`traefik.${DOMAIN}\`)"
      - "traefik.http.routers.traefik.service=api@internal"
      - "traefik.http.routers.traefik.entrypoints=websecure"
      - "traefik.http.routers.traefik.tls.certresolver=letsencrypt"
      - "traefik.http.routers.traefik.middlewares=traefik-auth"
      - "traefik.http.middlewares.traefik-auth.basicauth.users=admin:$(htpasswd -nb admin admin | sed -e s/\\$/\\$\\$/g)"

  # MySQL Database
  mysql:
    image: mysql:8.0
    container_name: vnsm-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./docker/mysql/init:/docker-entrypoint-initdb.d
    networks:
      - backend-network
    command: --default-authentication-plugin=mysql_native_password --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci

  # phpMyAdmin
  phpmyadmin:
    image: phpmyadmin/phpmyadmin
    container_name: vnsm-phpmyadmin
    restart: unless-stopped
    environment:
      PMA_HOST: mysql
      PMA_PORT: 3306
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      UPLOAD_LIMIT: 64M
    networks:
      - backend-network
      - traefik-network
    depends_on:
      - mysql
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.phpmyadmin.rule=Host(\`${PMA_SUBDOMAIN}.${DOMAIN}\`)"
      - "traefik.http.routers.phpmyadmin.entrypoints=websecure"
      - "traefik.http.routers.phpmyadmin.tls.certresolver=letsencrypt"
      - "traefik.http.services.phpmyadmin.loadbalancer.server.port=80"

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: vnsm-backend
    restart: unless-stopped
    environment:
      NODE_ENV: ${ENVIRONMENT}
      PORT: 3001
      DB_HOST: mysql
      DB_USER: ${MYSQL_USER}
      DB_PASSWORD: ${MYSQL_PASSWORD}
      DB_NAME: ${MYSQL_DATABASE}
      DB_PORT: 3306
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: 1d
      DATABASE_URL: mysql://${MYSQL_USER}:${MYSQL_PASSWORD}@mysql:3306/${MYSQL_DATABASE}
    volumes:
      - ./backend/public:/app/public
    networks:
      - backend-network
      - traefik-network
    depends_on:
      - mysql
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(\`${API_SUBDOMAIN}.${DOMAIN}\`)"
      - "traefik.http.routers.backend.entrypoints=websecure"
      - "traefik.http.routers.backend.tls.certresolver=letsencrypt"
      - "traefik.http.services.backend.loadbalancer.server.port=3001"

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: https://${API_SUBDOMAIN}.${DOMAIN}
    container_name: vnsm-frontend
    restart: unless-stopped
    environment:
      NODE_ENV: ${ENVIRONMENT}
      NEXT_PUBLIC_API_URL: https://${API_SUBDOMAIN}.${DOMAIN}
    networks:
      - traefik-network
    depends_on:
      - backend
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(\`${DOMAIN}\`)"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
      - "traefik.http.services.frontend.loadbalancer.server.port=3000"
EOL

  print_message "Đã tạo file docker-compose.yml thành công!"
}

# Tạo Dockerfile cho backend
create_backend_dockerfile() {
  print_message "Tạo Dockerfile cho backend..."
  
  cat > ./backend/Dockerfile << EOL
FROM node:18-alpine

WORKDIR /app

# Cài đặt các dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Tạo Prisma client
RUN npx prisma generate

# Build ứng dụng
RUN npm run build

# Expose port
EXPOSE 3001

# Khởi động ứng dụng
CMD ["npm", "start"]
EOL

  print_message "Đã tạo Dockerfile cho backend thành công!"
}

# Tạo Dockerfile cho frontend
create_frontend_dockerfile() {
  print_message "Tạo Dockerfile cho frontend..."
  
  cat > ./frontend/Dockerfile << EOL
FROM node:18-alpine AS builder

WORKDIR /app

# Cài đặt các dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build ứng dụng
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=\${NEXT_PUBLIC_API_URL}
RUN npm run build

# Production image
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Copy các file cần thiết từ builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose port
EXPOSE 3000

# Khởi động ứng dụng
CMD ["node", "server.js"]
EOL

  print_message "Đã tạo Dockerfile cho frontend thành công!"
}

# Tạo file cấu hình Traefik
create_traefik_config() {
  print_message "Tạo file cấu hình Traefik..."
  
  cat > ./docker/traefik/config/traefik.yml << EOL
# Traefik Static Configuration
global:
  checkNewVersion: true
  sendAnonymousUsage: false

api:
  dashboard: true
  insecure: false

log:
  level: INFO

accessLog: {}

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

certificatesResolvers:
  letsencrypt:
    acme:
      email: ${EMAIL}
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web
EOL

  print_message "Đã tạo file cấu hình Traefik thành công!"
}

# Triển khai ứng dụng
deploy_application() {
  print_message "Bắt đầu triển khai ứng dụng..."
  
  # Khởi động các container
  docker-compose up -d
  
  # Kiểm tra trạng thái
  docker-compose ps
  
  print_message "Ứng dụng đã được triển khai thành công!"
  print_message "Frontend: https://${DOMAIN}"
  print_message "Backend API: https://${API_SUBDOMAIN}.${DOMAIN}"
  print_message "phpMyAdmin: https://${PMA_SUBDOMAIN}.${DOMAIN}"
  print_message "Traefik Dashboard: https://traefik.${DOMAIN} (username: admin, password: admin)"
}

# Hàm chính
main() {
  print_message "=== Bắt đầu quá trình triển khai VNSM ==="
  
  # Kiểm tra Docker
  check_docker
  
  # Lấy thông tin cấu hình
  get_config
  
  # Tạo thư mục cần thiết
  create_directories
  
  # Tạo các file cấu hình
  create_docker_compose
  create_backend_dockerfile
  create_frontend_dockerfile
  create_traefik_config
  
  # Triển khai ứng dụng
  deploy_application
  
  print_message "=== Quá trình triển khai VNSM hoàn tất ==="
}

# Chạy hàm chính
main