#!/bin/bash

echo "=== VNSM Build and Deploy ==="
echo ""

# Kiểm tra vị trí đang chạy script
CURRENT_DIR=$(pwd)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Di chuyển đến thư mục deployment nếu cần
if [ "$CURRENT_DIR" != "$SCRIPT_DIR" ]; then
  echo "Di chuyển đến thư mục deployment..."
  cd "$SCRIPT_DIR"
fi

# Kiểm tra các thư mục cần thiết
echo "Chuẩn bị các thư mục cần thiết..."
mkdir -p traefik/data backup/db uploads

# Kiểm tra và tạo file acme.json với quyền thích hợp
if [ ! -f traefik/acme.json ]; then
  echo "Tạo file acme.json..."
  touch traefik/acme.json
fi
chmod 600 traefik/acme.json

# Kiểm tra file .env
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    echo "Tạo file .env từ file mẫu .env.example..."
    cp .env.example .env
    echo "⚠️ Vui lòng chỉnh sửa file .env với các giá trị phù hợp!"
  else
    echo "❌ Không tìm thấy file .env.example. Vui lòng tạo file .env thủ công."
    exit 1
  fi
fi

# Tạo network Docker nếu chưa tồn tại
if ! docker network ls | grep -q proxy; then
  echo "Tạo network Docker 'proxy'..."
  docker network create proxy
  echo "✅ Đã tạo network Docker 'proxy'."
else
  echo "✅ Network Docker 'proxy' đã tồn tại."
fi

# Cấp quyền thực thi cho các script backup
chmod +x backup/*.sh 2>/dev/null
echo "✅ Đã cấp quyền thực thi cho các script backup."

echo ""
echo "=== Build và Deploy ==="
echo "Đang khởi chạy ứng dụng với docker-compose..."
docker-compose up -d

echo ""
echo "=== Hoàn Tất ==="
echo "Kiểm tra trạng thái các container:"
docker-compose ps

echo ""
echo "Các dịch vụ sẽ được khả dụng tại:"
source .env 2>/dev/null
echo "- Website: https://$DOMAIN"
echo "- API: https://api.$DOMAIN"
echo "- Database Admin: https://db.$DOMAIN"
echo "- Traefik Dashboard: https://traefik.$DOMAIN" 