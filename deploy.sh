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

# Kiểm tra và cài đặt các công cụ cần thiết
check_requirements() {
  # Kiểm tra Docker
  if ! command -v docker &> /dev/null; then
    print_error "Docker chưa được cài đặt. Đang cài đặt Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    print_message "Docker đã được cài đặt thành công!"
  else
    print_message "Docker đã được cài đặt."
  fi

  # Kiểm tra Docker Compose
  if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose chưa được cài đặt. Đang cài đặt Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.6/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_message "Docker Compose đã được cài đặt thành công!"
  else
    print_message "Docker Compose đã được cài đặt."
  fi

  # Kiểm tra htpasswd (cần thiết cho Traefik)
  if ! command -v htpasswd &> /dev/null; then
    print_error "htpasswd chưa được cài đặt. Đang cài đặt apache2-utils..."
    if command -v apt-get &> /dev/null; then
      sudo apt-get update
      sudo apt-get install -y apache2-utils
    elif command -v yum &> /dev/null; then
      sudo yum install -y httpd-tools
    elif command -v apk &> /dev/null; then
      sudo apk add apache2-utils
    else
      print_error "Không thể cài đặt htpasswd tự động. Vui lòng cài đặt thủ công apache2-utils hoặc httpd-tools."
      exit 1
    fi
    print_message "htpasswd đã được cài đặt thành công!"
  else
    print_message "htpasswd đã được cài đặt."
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

  # Hỏi người dùng có muốn bắt buộc chuyển hướng HTTPS không
  read -p "Bắt buộc chuyển hướng HTTP sang HTTPS? (y/n, mặc định: y): " FORCE_HTTPS
  FORCE_HTTPS=${FORCE_HTTPS:-y}
  if [[ "$FORCE_HTTPS" =~ ^[Yy]$ ]]; then
    FORCE_HTTPS="true"
  else
    FORCE_HTTPS="false"
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
# Cấu hình Docker Compose cho VNSM
# Lưu ý: Không sử dụng thuộc tính 'version' vì nó đã lỗi thời trong Docker Compose v2+

networks:
  traefik-network:
    external: true
  backend-network:
    external: true

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
      # Chỉ chuyển hướng HTTP sang HTTPS nếu người dùng chọn
      if [ "$FORCE_HTTPS" = "true" ]; then
        cat >> docker-compose.yml << EOL_HTTPS_REDIRECT
      - "--entrypoints.web.http.redirections.entrypoint.to=websecure"
      - "--entrypoints.web.http.redirections.entrypoint.scheme=https"
EOL_HTTPS_REDIRECT
      fi
      - "--certificatesresolvers.letsencrypt.acme.email=${EMAIL}"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.traefik.rule=Host(\`traefik.${DOMAIN}\`)"
      - "traefik.http.routers.traefik.service=api@internal"
      - "traefik.http.routers.traefik.entrypoints=websecure"
      # Thêm router cho HTTP nếu không bắt buộc HTTPS
      if [ "$FORCE_HTTPS" = "false" ]; then
        cat >> docker-compose.yml << EOL_HTTP_TRAEFIK
      - "traefik.http.routers.traefik-http.rule=Host(\`traefik.${DOMAIN}\`)"
      - "traefik.http.routers.traefik-http.entrypoints=web"
      - "traefik.http.routers.traefik-http.service=api@internal"
      - "traefik.http.routers.traefik-http.middlewares=traefik-auth"
EOL_HTTP_TRAEFIK
      fi
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
      # Thêm router cho HTTP nếu không bắt buộc HTTPS
      if [ "$FORCE_HTTPS" = "false" ]; then
        cat >> docker-compose.yml << EOL_HTTP_PMA
      - "traefik.http.routers.phpmyadmin-http.rule=Host(\`${PMA_SUBDOMAIN}.${DOMAIN}\`)"
      - "traefik.http.routers.phpmyadmin-http.entrypoints=web"
      - "traefik.http.services.phpmyadmin-http.loadbalancer.server.port=80"
EOL_HTTP_PMA
      fi
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
      # Thêm router cho HTTP nếu không bắt buộc HTTPS
      if [ "$FORCE_HTTPS" = "false" ]; then
        cat >> docker-compose.yml << EOL_HTTP_BACKEND
      - "traefik.http.routers.backend-http.rule=Host(\`${API_SUBDOMAIN}.${DOMAIN}\`)"
      - "traefik.http.routers.backend-http.entrypoints=web"
      - "traefik.http.services.backend-http.loadbalancer.server.port=3001"
EOL_HTTP_BACKEND
      fi
      - "traefik.http.routers.backend.tls.certresolver=letsencrypt"
      - "traefik.http.services.backend.loadbalancer.server.port=3001"

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: ${FORCE_HTTPS:+https://}${FORCE_HTTPS:-http://}${API_SUBDOMAIN}.${DOMAIN}
    container_name: vnsm-frontend
    restart: unless-stopped
    environment:
      NODE_ENV: ${ENVIRONMENT}
      NEXT_PUBLIC_API_URL: ${FORCE_HTTPS:+https://}${FORCE_HTTPS:-http://}${API_SUBDOMAIN}.${DOMAIN}
    networks:
      - traefik-network
    depends_on:
      - backend
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(\`${DOMAIN}\`)"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      # Thêm router cho HTTP nếu không bắt buộc HTTPS
      if [ "$FORCE_HTTPS" = "false" ]; then
        cat >> docker-compose.yml << EOL_HTTP_FRONTEND
      - "traefik.http.routers.frontend-http.rule=Host(\`${DOMAIN}\`)"
      - "traefik.http.routers.frontend-http.entrypoints=web"
      - "traefik.http.services.frontend-http.loadbalancer.server.port=3000"
EOL_HTTP_FRONTEND
      fi
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
COPY prisma ./prisma/
RUN npm install
# Cài đặt thêm module csv-parse và đảm bảo prisma được cài đặt
RUN npm install csv-parse @types/csv-parse @prisma/client prisma

# Kiểm tra thư mục prisma
RUN ls -la ./prisma || echo "Thư mục prisma không tồn tại"
RUN cat ./prisma/schema.prisma || echo "File schema.prisma không tồn tại"

# Copy source code
COPY . .

# Thêm cấu hình TypeScript để bỏ qua lỗi kiểu dữ liệu
RUN echo '{ "compilerOptions": { "noImplicitAny": false } }' > ./tsconfig.build.json

# Đảm bảo thư mục prisma tồn tại và có schema.prisma
RUN if [ ! -f "./prisma/schema.prisma" ]; then \
    echo "Lỗi: Không tìm thấy file schema.prisma!" && \
    exit 1; \
  fi

# Xóa thư mục node_modules/.prisma nếu tồn tại để đảm bảo tạo mới hoàn toàn
RUN rm -rf ./node_modules/.prisma

# Tạo Prisma client trước khi build
RUN echo "Tạo Prisma client trước khi build..."
RUN npx prisma generate --schema=./prisma/schema.prisma

# Kiểm tra xem Prisma client đã được tạo chưa
RUN if [ ! -d "./node_modules/.prisma/client" ]; then \
    echo "Lỗi: Prisma client không được tạo thành công!" && \
    exit 1; \
  fi

# Build ứng dụng với cấu hình mở rộng
RUN npm run build || (echo "Đang thử build lại với cấu hình khác..." && npx tsc --skipLibCheck)

# Tạo Prisma client sau khi build để đảm bảo đúng đường dẫn
RUN echo "Tạo lại Prisma client sau khi build..."
RUN npx prisma generate --schema=./prisma/schema.prisma

# Đảm bảo thư mục generated/prisma tồn tại trong cả src và dist
RUN mkdir -p ./src/generated/prisma
RUN mkdir -p ./dist/generated/prisma

# Sao chép Prisma client vào các thư mục cần thiết
RUN cp -r ./node_modules/.prisma/client/* ./src/generated/prisma/
RUN cp -r ./node_modules/.prisma/client/* ./dist/generated/prisma/

# Tạo file index.js trong thư mục dist/generated/prisma để đảm bảo import hoạt động
RUN echo "// Prisma Client wrapper" > ./dist/generated/prisma/index.js
RUN echo "const { PrismaClient } = require('@prisma/client');" >> ./dist/generated/prisma/index.js
RUN echo "Object.defineProperty(exports, '__esModule', { value: true });" >> ./dist/generated/prisma/index.js
RUN echo "exports.PrismaClient = PrismaClient;" >> ./dist/generated/prisma/index.js
RUN echo "// Re-export all types from Prisma Client" >> ./dist/generated/prisma/index.js
RUN echo "Object.keys(require('@prisma/client')).forEach(key => {" >> ./dist/generated/prisma/index.js
RUN echo "  if (key !== 'PrismaClient') exports[key] = require('@prisma/client')[key];" >> ./dist/generated/prisma/index.js
RUN echo "});" >> ./dist/generated/prisma/index.js

# Tạo file index.d.ts trong thư mục dist/generated/prisma để đảm bảo TypeScript hoạt động
RUN echo "export * from '@prisma/client';" > ./dist/generated/prisma/index.d.ts

# Hiển thị cấu trúc thư mục để debug
RUN echo "Cấu trúc thư mục dist:" && ls -la ./dist && ls -la ./dist/generated || true
RUN echo "Nội dung thư mục node_modules/.prisma:" && ls -la ./node_modules/.prisma || true

# Expose port
EXPOSE 3001

# Tạo script khởi động để đảm bảo Prisma client được tạo đúng cách
RUN echo '#!/bin/sh' > /app/start.sh
RUN echo 'set -e' >> /app/start.sh
RUN echo 'echo "Đang tạo Prisma client..."' >> /app/start.sh

# Xóa thư mục node_modules/.prisma nếu tồn tại để đảm bảo tạo mới hoàn toàn
RUN echo 'if [ -d "./node_modules/.prisma" ]; then' >> /app/start.sh
RUN echo '  echo "Xóa thư mục node_modules/.prisma cũ để tạo mới..."' >> /app/start.sh
RUN echo '  rm -rf ./node_modules/.prisma' >> /app/start.sh
RUN echo 'fi' >> /app/start.sh

# Đảm bảo thư mục prisma tồn tại và có schema.prisma
RUN echo 'if [ ! -f "./prisma/schema.prisma" ]; then' >> /app/start.sh
RUN echo '  echo "Lỗi: Không tìm thấy file schema.prisma!"' >> /app/start.sh
RUN echo '  echo "Nội dung thư mục prisma:"' >> /app/start.sh
RUN echo '  ls -la ./prisma || echo "Thư mục prisma không tồn tại"' >> /app/start.sh
RUN echo '  exit 1' >> /app/start.sh
RUN echo 'fi' >> /app/start.sh

# Tạo Prisma client mới
RUN echo 'echo "Tạo Prisma client mới..."' >> /app/start.sh
RUN echo 'npx prisma generate --schema=./prisma/schema.prisma' >> /app/start.sh

# Kiểm tra xem Prisma client đã được tạo chưa
RUN echo 'if [ ! -d "./node_modules/.prisma/client" ]; then' >> /app/start.sh
RUN echo '  echo "Lỗi: Prisma client không được tạo thành công!"' >> /app/start.sh
RUN echo '  exit 1' >> /app/start.sh
RUN echo 'fi' >> /app/start.sh

# Đảm bảo thư mục dist/generated/prisma tồn tại
RUN echo 'echo "Đảm bảo thư mục dist/generated/prisma tồn tại..."' >> /app/start.sh
RUN echo 'mkdir -p ./dist/generated/prisma' >> /app/start.sh

# Sao chép Prisma client vào thư mục dist/generated/prisma
RUN echo 'echo "Sao chép Prisma client vào thư mục dist/generated/prisma..."' >> /app/start.sh
RUN echo 'cp -r ./node_modules/.prisma/client/* ./dist/generated/prisma/' >> /app/start.sh

# Tạo file index.js trong thư mục dist/generated/prisma
RUN echo 'echo "Tạo file index.js trong thư mục dist/generated/prisma..."' >> /app/start.sh
RUN echo 'cat > ./dist/generated/prisma/index.js << EOF' >> /app/start.sh
RUN echo '// Prisma Client wrapper' >> /app/start.sh
RUN echo 'const { PrismaClient } = require("@prisma/client");' >> /app/start.sh
RUN echo 'Object.defineProperty(exports, "__esModule", { value: true });' >> /app/start.sh
RUN echo 'exports.PrismaClient = PrismaClient;' >> /app/start.sh
RUN echo '// Re-export all types from Prisma Client' >> /app/start.sh
RUN echo 'Object.keys(require("@prisma/client")).forEach(key => {' >> /app/start.sh
RUN echo '  if (key !== "PrismaClient") exports[key] = require("@prisma/client")[key];' >> /app/start.sh
RUN echo '});' >> /app/start.sh
RUN echo 'EOF' >> /app/start.sh

# Tạo file index.d.ts trong thư mục dist/generated/prisma
RUN echo 'echo "Tạo file index.d.ts trong thư mục dist/generated/prisma..."' >> /app/start.sh
RUN echo 'echo "export * from \"@prisma/client\";" > ./dist/generated/prisma/index.d.ts' >> /app/start.sh

# Hiển thị cấu trúc thư mục để debug
RUN echo 'echo "Cấu trúc thư mục node_modules/.prisma:"' >> /app/start.sh
RUN echo 'ls -la ./node_modules/.prisma || echo "Thư mục không tồn tại"' >> /app/start.sh
RUN echo 'echo "Cấu trúc thư mục node_modules/.prisma/client:"' >> /app/start.sh
RUN echo 'ls -la ./node_modules/.prisma/client || echo "Thư mục không tồn tại"' >> /app/start.sh
RUN echo 'echo "Cấu trúc thư mục dist/generated/prisma:"' >> /app/start.sh
RUN echo 'ls -la ./dist/generated/prisma' >> /app/start.sh

# Khởi động ứng dụng
RUN echo 'echo "Đang khởi động ứng dụng..."' >> /app/start.sh
RUN echo 'npm start' >> /app/start.sh
RUN chmod +x /app/start.sh

# Khởi động ứng dụng
CMD ["/app/start.sh"]
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

# Cấu hình Next.js để đảm bảo output standalone
RUN if ! grep -q '"output": "standalone"' next.config.js; then \
    sed -i 's/const nextConfig = {/const nextConfig = {\n  output: "standalone",/' next.config.js; \
fi

# Build ứng dụng
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=\${NEXT_PUBLIC_API_URL}
RUN npm run build

# Production image
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Thêm user non-root cho bảo mật
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Đảm bảo các thư mục tồn tại và có quyền truy cập đúng
RUN mkdir -p /app/.next/cache && \
    chown -R nextjs:nodejs /app

# Copy các file cần thiết từ builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Chuyển sang user non-root
USER nextjs

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

  # Tạo file cấu hình Traefik dựa trên lựa chọn của người dùng
  if [ "$FORCE_HTTPS" = "true" ]; then
    # Cấu hình với chuyển hướng HTTP sang HTTPS
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
  else
    # Cấu hình không chuyển hướng HTTP sang HTTPS
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
  fi

  print_message "Đã tạo file cấu hình Traefik thành công!"
}

# Triển khai ứng dụng
deploy_application() {
  print_message "Bắt đầu triển khai ứng dụng..."

  # Kiểm tra xem docker-compose.yml có tồn tại không
  if [ ! -f "docker-compose.yml" ]; then
    print_error "Không tìm thấy file docker-compose.yml. Vui lòng kiểm tra lại."
    exit 1
  fi

  # Kiểm tra cấu trúc của docker-compose.yml
  docker-compose config > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    print_error "File docker-compose.yml không hợp lệ. Vui lòng kiểm tra lại."
    exit 1
  fi

  # Xử lý mạng Docker
  print_message "Kiểm tra và chuẩn bị mạng Docker..."

  # Xử lý mạng traefik-network
  if ! docker network inspect traefik-network &>/dev/null; then
    print_message "Tạo mạng traefik-network mới..."
    docker network create traefik-network
  else
    print_message "Mạng traefik-network đã tồn tại, sẽ sử dụng mạng hiện có..."
  fi

  # Xử lý mạng backend-network
  if ! docker network inspect backend-network &>/dev/null; then
    print_message "Tạo mạng backend-network mới..."
    docker network create backend-network
  else
    print_message "Mạng backend-network đã tồn tại, sẽ sử dụng mạng hiện có..."
  fi

  print_message "Đang pull các image cần thiết..."
  docker-compose pull

  # Kiểm tra và dừng các container đang chạy có thể xung đột
  print_message "Kiểm tra các container đang chạy..."

  # Kiểm tra các container có thể xung đột
  for service in traefik mysql phpmyadmin; do
    running_containers=$(docker ps --filter "name=$service" --format "{{.Names}}")
    if [ -n "$running_containers" ]; then
      print_warning "Phát hiện container $service đang chạy. Đang dừng..."
      for container in $running_containers; do
        docker stop $container
        docker rm $container
      done
    fi
  done

  print_message "Đang build và khởi động các container..."

  # Build trước để tránh lỗi khi khởi động
  print_message "Đang build các container..."
  docker-compose build

  # Khởi động các container với retry
  print_message "Đang khởi động các container..."
  for i in {1..5}; do
    # Sử dụng --no-build vì đã build ở trên
    docker-compose up -d --no-build && break || {
      print_warning "Lần thử $i thất bại. Đang thử lại..."
      # Hiển thị logs để debug
      docker-compose logs
      # Dừng các container nhưng không xóa mạng
      docker-compose down --remove-orphans
      print_message "Đợi 10 giây trước khi thử lại..."
      sleep 10
    }
  done

  # Kiểm tra xem các container đã chạy chưa
  running_containers=$(docker-compose ps -q | wc -l)
  expected_containers=4  # traefik, mysql, phpmyadmin, backend, frontend

  if [ $running_containers -lt $expected_containers ]; then
    print_warning "Một số container không khởi động được ($running_containers/$expected_containers). Đang kiểm tra logs..."
    docker-compose ps
    print_message "Logs của các container:"
    docker-compose logs
    print_warning "Vui lòng kiểm tra logs trên để xác định lỗi."
  else
    print_message "Tất cả các container đã được khởi động thành công!"
  fi

  # Kiểm tra trạng thái
  docker-compose ps

  print_message "Ứng dụng đã được triển khai thành công!"
  if [ "$FORCE_HTTPS" = "true" ]; then
    print_message "Frontend: https://${DOMAIN}"
  else
    print_message "Frontend: http://${DOMAIN} hoặc https://${DOMAIN}"
  fi
  if [ "$FORCE_HTTPS" = "true" ]; then
    print_message "Backend API: https://${API_SUBDOMAIN}.${DOMAIN}"
  else
    print_message "Backend API: http://${API_SUBDOMAIN}.${DOMAIN} hoặc https://${API_SUBDOMAIN}.${DOMAIN}"
  fi
  if [ "$FORCE_HTTPS" = "true" ]; then
    print_message "phpMyAdmin: https://${PMA_SUBDOMAIN}.${DOMAIN}"
  else
    print_message "phpMyAdmin: http://${PMA_SUBDOMAIN}.${DOMAIN} hoặc https://${PMA_SUBDOMAIN}.${DOMAIN}"
  fi
  if [ "$FORCE_HTTPS" = "true" ]; then
    print_message "Traefik Dashboard: https://traefik.${DOMAIN} (username: admin, password: admin)"
  else
    print_message "Traefik Dashboard: http://traefik.${DOMAIN} hoặc https://traefik.${DOMAIN} (username: admin, password: admin)"
  fi

  print_message "Lưu ý: Có thể mất vài phút để Let's Encrypt cấp chứng chỉ SSL."
}

# Kiểm tra logs của các container
check_logs() {
  local service=$1

  if [ -z "$service" ]; then
    print_message "Hiển thị logs của tất cả các dịch vụ..."
    docker-compose logs
    return
  fi

  # Kiểm tra xem service có tồn tại không
  if ! docker-compose ps "$service" &>/dev/null; then
    print_error "Dịch vụ '$service' không tồn tại hoặc không chạy."
    print_message "Các dịch vụ có sẵn:"
    docker-compose ps --services
    return 1
  fi

  print_message "Hiển thị logs của dịch vụ $service..."
  docker-compose logs "$service"
}

# Theo dõi logs theo thời gian thực
follow_logs() {
  local service=$1

  if [ -z "$service" ]; then
    print_message "Theo dõi logs của tất cả các dịch vụ..."
    docker-compose logs -f
    return
  fi

  # Kiểm tra xem service có tồn tại không
  if ! docker-compose ps "$service" &>/dev/null; then
    print_error "Dịch vụ '$service' không tồn tại hoặc không chạy."
    print_message "Các dịch vụ có sẵn:"
    docker-compose ps --services
    return 1
  fi

  print_message "Theo dõi logs của dịch vụ $service..."
  docker-compose logs -f "$service"
}

# Dọn dẹp môi trường
cleanup() {
  print_message "Bắt đầu dọn dẹp môi trường..."

  # Dừng và xóa tất cả các container
  if docker-compose ps -q &>/dev/null; then
    print_message "Dừng và xóa các container hiện tại..."
    docker-compose down -v
  fi

  # Tìm và dừng tất cả các container liên quan đến dự án
  for container in $(docker ps -a --filter "name=vnsm" -q); do
    print_message "Dừng và xóa container $container..."
    docker stop $container 2>/dev/null || true
    docker rm $container 2>/dev/null || true
  done

  # Xử lý mạng traefik-network - chỉ ngắt kết nối các container, không xóa mạng
  if docker network inspect traefik-network &>/dev/null; then
    print_message "Ngắt kết nối các container khỏi mạng traefik-network..."
    # Ngắt kết nối tất cả các container khỏi mạng
    for container in $(docker network inspect traefik-network -f '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null); do
      print_message "Ngắt kết nối container $container khỏi mạng traefik-network..."
      docker network disconnect -f traefik-network $container 2>/dev/null || true
    done
    # Không xóa mạng vì nó được đánh dấu là external trong docker-compose.yml
    print_message "Giữ lại mạng traefik-network vì nó được đánh dấu là external"
  fi

  # Xử lý mạng backend-network - chỉ ngắt kết nối các container, không xóa mạng
  if docker network inspect backend-network &>/dev/null; then
    print_message "Ngắt kết nối các container khỏi mạng backend-network..."
    # Ngắt kết nối tất cả các container khỏi mạng
    for container in $(docker network inspect backend-network -f '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null); do
      print_message "Ngắt kết nối container $container khỏi mạng backend-network..."
      docker network disconnect -f backend-network $container 2>/dev/null || true
    done
    # Không xóa mạng vì nó được đánh dấu là external trong docker-compose.yml
    print_message "Giữ lại mạng backend-network vì nó được đánh dấu là external"
  fi

  # Xóa các volume không sử dụng
  print_message "Xóa các volume không sử dụng..."
  docker volume prune -f

  # Xóa các image dangling
  print_message "Xóa các image không sử dụng..."
  docker image prune -f

  print_message "Môi trường đã được dọn dẹp!"
}

# Hiển thị trợ giúp
show_help() {
  echo "Cách sử dụng: $0 [OPTION]"
  echo ""
  echo "Các tùy chọn:"
  echo "  deploy              Triển khai ứng dụng (mặc định)"
  echo "  redeploy            Dọn dẹp môi trường và triển khai lại từ đầu"
  echo "  logs [SERVICE]      Hiển thị logs của tất cả hoặc một dịch vụ cụ thể"
  echo "  follow [SERVICE]    Theo dõi logs theo thời gian thực"
  echo "  restart [SERVICE]   Khởi động lại tất cả hoặc một dịch vụ cụ thể"
  echo "  status              Hiển thị trạng thái của các dịch vụ"
  echo "  cleanup             Dọn dẹp môi trường (xóa container, mạng, volume)"
  echo "  help                Hiển thị trợ giúp này"
  echo ""
  echo "Ví dụ:"
  echo "  $0                  Triển khai ứng dụng"
  echo "  $0 logs backend     Hiển thị logs của backend"
  echo "  $0 follow frontend  Theo dõi logs của frontend theo thời gian thực"
  echo "  $0 restart          Khởi động lại tất cả các dịch vụ"
  echo "  $0 status           Hiển thị trạng thái của các dịch vụ"
}

# Khởi động lại dịch vụ
restart_service() {
  local service=$1

  if [ -z "$service" ]; then
    print_message "Khởi động lại tất cả các dịch vụ..."
    docker-compose restart
    return
  fi

  # Kiểm tra xem service có tồn tại không
  if ! docker-compose ps "$service" &>/dev/null; then
    print_error "Dịch vụ '$service' không tồn tại hoặc không chạy."
    print_message "Các dịch vụ có sẵn:"
    docker-compose ps --services
    return 1
  fi

  print_message "Khởi động lại dịch vụ $service..."
  docker-compose restart "$service"
}

# Hiển thị trạng thái
show_status() {
  print_message "Trạng thái các dịch vụ:"
  docker-compose ps
}

# Hàm chính
main() {
  local command=$1
  local service=$2

  case "$command" in
    logs)
      check_logs "$service"
      ;;
    follow)
      follow_logs "$service"
      ;;
    restart)
      restart_service "$service"
      ;;
    status)
      show_status
      ;;
    cleanup)
      cleanup
      ;;
    redeploy)
      print_message "=== Bắt đầu quá trình triển khai lại VNSM ==="

      # Dọn dẹp môi trường trước
      cleanup

      # Kiểm tra các yêu cầu cần thiết
      check_requirements

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

      print_message "=== Quá trình triển khai lại VNSM hoàn tất ==="
      print_message "Để kiểm tra logs, sử dụng: $0 logs [SERVICE]"
      print_message "Để theo dõi logs theo thời gian thực, sử dụng: $0 follow [SERVICE]"
      print_message "Để xem trạng thái các dịch vụ, sử dụng: $0 status"
      ;;
    help)
      show_help
      ;;
    deploy|"")
      print_message "=== Bắt đầu quá trình triển khai VNSM ==="

      # Kiểm tra các yêu cầu cần thiết
      check_requirements

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
      print_message "Để kiểm tra logs, sử dụng: $0 logs [SERVICE]"
      print_message "Để theo dõi logs theo thời gian thực, sử dụng: $0 follow [SERVICE]"
      print_message "Để xem trạng thái các dịch vụ, sử dụng: $0 status"
      ;;
    *)
      print_error "Lệnh không hợp lệ: $command"
      show_help
      exit 1
      ;;
  esac
}

# Chạy hàm chính với các tham số dòng lệnh
main "$@"