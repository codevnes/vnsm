#!/bin/bash

echo "=== Test Frontend Build (Không triển khai) ==="
echo ""

# Đường dẫn tương đối
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
FRONTEND_DIR="$SCRIPT_DIR/../frontend"

echo "1. Chuẩn bị frontend"
bash "$SCRIPT_DIR/prepare-frontend.sh"

echo ""
echo "2. Thử build frontend container (không triển khai)"
cd "$SCRIPT_DIR"
docker build -t vnsm-frontend-test -f Dockerfile.frontend "$FRONTEND_DIR"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ BUILD THÀNH CÔNG!"
  echo "Các sửa đổi đã hoạt động. Bạn có thể triển khai bằng lệnh:"
  echo "cd $SCRIPT_DIR && ./build.sh"
  
  # Xóa container thử nghiệm
  echo ""
  echo "Đang xóa container thử nghiệm..."
  docker rmi vnsm-frontend-test
else
  echo ""
  echo "❌ BUILD THẤT BẠI!"
  echo "Vui lòng kiểm tra logs để biết thêm chi tiết lỗi."
fi 