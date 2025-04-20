#!/bin/bash

echo "=== Chuẩn bị triển khai Frontend ==="
echo ""

# Đường dẫn tương đối
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
FRONTEND_DIR="$SCRIPT_DIR/../frontend"

# Kiểm tra thư mục frontend
if [ ! -d "$FRONTEND_DIR" ]; then
  echo "❌ Không tìm thấy thư mục frontend tại $FRONTEND_DIR"
  exit 1
fi

# Di chuyển vào thư mục frontend
cd "$FRONTEND_DIR"

# Kiểm tra package.json
if [ ! -f "package.json" ]; then
  echo "❌ Không tìm thấy file package.json trong thư mục frontend"
  exit 1
fi

# Sao chép file .dockerignore
cp "$SCRIPT_DIR/.dockerignore-frontend" "$FRONTEND_DIR/.dockerignore"
echo "✅ Đã sao chép file .dockerignore"

# Sao chép file cấu hình ESLint cho production
cp "$SCRIPT_DIR/eslintrc-production.js" "$FRONTEND_DIR/.eslintrc.js"
echo "✅ Đã sao chép file cấu hình ESLint cho production"

# Kiểm tra cấu hình Next.js (hỗ trợ cả .ts và .js)
if [ -f "next.config.ts" ]; then
  echo "Phát hiện next.config.ts, tạo next.config.js cho production..."
  # Backup file cấu hình hiện tại
  mv next.config.ts next.config.ts.bak
  # Sao chép file cấu hình từ deployment và thay thế biến DOMAIN
  source "$SCRIPT_DIR/.env" 2>/dev/null
  cat "$SCRIPT_DIR/next.config.production.js" | sed "s/\${DOMAIN}/$DOMAIN/g" > next.config.js
  echo "✅ Đã tạo next.config.js từ mẫu production"
elif [ -f "next.config.js" ]; then
  echo "Sao chép file cấu hình Next.js cho production..."
  # Backup file cấu hình hiện tại
  mv next.config.js next.config.js.bak
  # Sao chép file cấu hình từ deployment và thay thế biến DOMAIN
  source "$SCRIPT_DIR/.env" 2>/dev/null
  cat "$SCRIPT_DIR/next.config.production.js" | sed "s/\${DOMAIN}/$DOMAIN/g" > next.config.js
  echo "✅ Đã sao chép và cấu hình next.config.js"
else
  echo "⚠️ Không tìm thấy file cấu hình Next.js, tạo file mới..."
  source "$SCRIPT_DIR/.env" 2>/dev/null
  cat "$SCRIPT_DIR/next.config.production.js" | sed "s/\${DOMAIN}/$DOMAIN/g" > next.config.js
  echo "✅ Đã tạo file next.config.js"
fi

# Kiểm tra và xử lý ESLint config hiện đại (eslint.config.mjs)
if [ -f "eslint.config.mjs" ]; then
  echo "Phát hiện eslint.config.mjs, cấu hình cho production..."
  mv eslint.config.mjs eslint.config.mjs.bak
  echo "// Production ESLint config
export default {
  extends: [],
  rules: {},
  // Tắt tất cả các quy tắc trong môi trường production
  ignores: ['**/*']
};" > eslint.config.mjs
  echo "✅ Đã cấu hình eslint.config.mjs cho production"
fi

# Kiểm tra file .env.production
if [ ! -f ".env.production" ]; then
  echo "⚠️ Không tìm thấy file .env.production, tạo file mới..."
  source "$SCRIPT_DIR/.env"
  cat > .env.production << EOF
NEXT_PUBLIC_API_URL=https://api.${DOMAIN}/api
NEXT_DISABLE_ESLINT=1
EOF
  echo "✅ Đã tạo file .env.production"
fi

# Tăng giới hạn bộ nhớ cho Node.js
export NODE_OPTIONS="--max-old-space-size=4096"

echo ""
echo "=== Thông tin quan trọng ==="
echo "✅ NODE_OPTIONS: $NODE_OPTIONS"
echo "✅ NEXT_PUBLIC_API_URL: https://api.${DOMAIN}/api (đã thiết lập trong build args của Docker)"
echo ""
echo "=== Chuẩn bị triển khai Frontend hoàn tất ==="
echo "Để build và triển khai, hãy chạy lệnh:"
echo "cd $(dirname $SCRIPT_DIR) && ./deployment/build.sh" 