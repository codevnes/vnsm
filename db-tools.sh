#!/bin/bash

# Thông tin cơ sở dữ liệu
DB_CONTAINER="vnsm-mysql"
DB_USER="root"
DB_PASSWORD="Timem.2302"
DB_NAME="vsmi_db"
BACKUP_DIR="./database/backups"

# Thông tin cơ sở dữ liệu local
LOCAL_DB_HOST="localhost"
LOCAL_DB_PORT="3306"
LOCAL_DB_USER="root"
LOCAL_DB_PASSWORD="Timem.2302"
LOCAL_DB_NAME="vsmi_db"

# Mặc định sử dụng Docker
USE_LOCAL=false

# Màu sắc cho output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Tạo thư mục backup nếu chưa tồn tại
mkdir -p "$BACKUP_DIR"

# Hiển thị banner
show_banner() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                                                           ║"
    echo "║             VSMI Database Management Tool                 ║"
    echo "║                                                           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Hiển thị menu
show_menu() {
    # Hiển thị chế độ hiện tại
    if [ "$USE_LOCAL" = true ]; then
        echo -e "${GREEN}Chế độ: Local MySQL${NC}"
    else
        echo -e "${GREEN}Chế độ: Docker Container${NC}"
    fi
    
    echo -e "${YELLOW}Chọn một tùy chọn:${NC}"
    echo "1) Export database (sao lưu)"
    echo "2) Import database (khôi phục)"
    echo "3) Liệt kê các bản sao lưu"
    echo "4) Xóa bản sao lưu"
    echo "5) Chuyển đổi chế độ (Local/Docker)"
    echo "6) Cấu hình kết nối"
    echo "7) Thoát"
    echo
    echo -n "Nhập lựa chọn của bạn [1-7]: "
}

# Kiểm tra container MySQL có đang chạy không
check_mysql_container() {
    if ! docker ps | grep -q "$DB_CONTAINER"; then
        echo -e "${RED}Lỗi: Container MySQL '$DB_CONTAINER' không chạy.${NC}"
        echo -e "${YELLOW}Vui lòng khởi động container trước khi sử dụng công cụ này.${NC}"
        exit 1
    fi
}

# Export database
export_database() {
    # Tạo tên file backup với timestamp
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    
    if [ "$USE_LOCAL" = true ]; then
        # Sử dụng MySQL local
        BACKUP_FILE="$BACKUP_DIR/${LOCAL_DB_NAME}_local_${TIMESTAMP}.sql"
        
        echo -e "${YELLOW}Đang export database ${LOCAL_DB_NAME} từ MySQL local...${NC}"
        
        # Kiểm tra xem mysqldump có sẵn không
        if ! command -v mysqldump &> /dev/null; then
            echo -e "${RED}Lỗi: Lệnh mysqldump không tìm thấy.${NC}"
            echo -e "${YELLOW}Vui lòng cài đặt MySQL client hoặc chuyển sang chế độ Docker.${NC}"
            return 1
        fi
        
        # Thực hiện lệnh export
        mysqldump -h"$LOCAL_DB_HOST" -P"$LOCAL_DB_PORT" -u"$LOCAL_DB_USER" -p"$LOCAL_DB_PASSWORD" --databases "$LOCAL_DB_NAME" > "$BACKUP_FILE"
    else
        # Sử dụng Docker container
        check_mysql_container
        
        BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_docker_${TIMESTAMP}.sql"
        
        echo -e "${YELLOW}Đang export database ${DB_NAME} từ Docker container...${NC}"
        
        # Thực hiện lệnh export
        docker exec "$DB_CONTAINER" mysqldump -u"$DB_USER" -p"$DB_PASSWORD" --databases "$DB_NAME" > "$BACKUP_FILE"
    fi
    
    # Kiểm tra kết quả
    if [ $? -eq 0 ]; then
        # Nén file backup để tiết kiệm không gian
        gzip "$BACKUP_FILE"
        BACKUP_FILE="${BACKUP_FILE}.gz"
        
        echo -e "${GREEN}Export thành công!${NC}"
        echo -e "File backup: ${BLUE}$BACKUP_FILE${NC}"
        echo -e "Kích thước: ${BLUE}$(du -h "$BACKUP_FILE" | cut -f1)${NC}"
    else
        echo -e "${RED}Export thất bại!${NC}"
    fi
}

# Import database
import_database() {
    # Liệt kê các file backup
    echo -e "${YELLOW}Các bản sao lưu có sẵn:${NC}"
    list_backups
    
    # Nếu không có file backup nào
    if [ ! "$(ls -A "$BACKUP_DIR")" ]; then
        echo -e "${RED}Không tìm thấy bản sao lưu nào.${NC}"
        return
    fi
    
    # Yêu cầu người dùng chọn file
    echo -n "Nhập số thứ tự của bản sao lưu muốn khôi phục (hoặc 0 để hủy): "
    read -r choice
    
    # Kiểm tra lựa chọn
    if [ "$choice" = "0" ]; then
        echo -e "${YELLOW}Đã hủy thao tác khôi phục.${NC}"
        return
    fi
    
    # Lấy danh sách file backup
    backup_files=("$BACKUP_DIR"/*)
    
    # Kiểm tra lựa chọn có hợp lệ không
    if ! [[ "$choice" =~ ^[0-9]+$ ]] || [ "$choice" -lt 1 ] || [ "$choice" -gt "${#backup_files[@]}" ]; then
        echo -e "${RED}Lựa chọn không hợp lệ.${NC}"
        return
    fi
    
    # Lấy file backup được chọn
    selected_file="${backup_files[$choice-1]}"
    
    # Xác nhận trước khi import
    echo -e "${RED}CẢNH BÁO: Thao tác này sẽ ghi đè lên cơ sở dữ liệu hiện tại.${NC}"
    echo -n "Bạn có chắc chắn muốn tiếp tục? (y/n): "
    read -r confirm
    
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo -e "${YELLOW}Đã hủy thao tác khôi phục.${NC}"
        return
    fi
    
    if [ "$USE_LOCAL" = true ]; then
        # Sử dụng MySQL local
        echo -e "${YELLOW}Đang import database vào MySQL local từ ${selected_file}...${NC}"
        
        # Kiểm tra xem mysql có sẵn không
        if ! command -v mysql &> /dev/null; then
            echo -e "${RED}Lỗi: Lệnh mysql không tìm thấy.${NC}"
            echo -e "${YELLOW}Vui lòng cài đặt MySQL client hoặc chuyển sang chế độ Docker.${NC}"
            return 1
        fi
        
        # Kiểm tra xem file có phải là file nén không
        if [[ "$selected_file" == *.gz ]]; then
            # Giải nén file và import
            gunzip -c "$selected_file" | mysql -h"$LOCAL_DB_HOST" -P"$LOCAL_DB_PORT" -u"$LOCAL_DB_USER" -p"$LOCAL_DB_PASSWORD"
        else
            # Import trực tiếp
            mysql -h"$LOCAL_DB_HOST" -P"$LOCAL_DB_PORT" -u"$LOCAL_DB_USER" -p"$LOCAL_DB_PASSWORD" < "$selected_file"
        fi
    else
        # Sử dụng Docker container
        check_mysql_container
        
        echo -e "${YELLOW}Đang import database vào Docker container từ ${selected_file}...${NC}"
        
        # Kiểm tra xem file có phải là file nén không
        if [[ "$selected_file" == *.gz ]]; then
            # Giải nén file và import
            gunzip -c "$selected_file" | docker exec -i "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD"
        else
            # Import trực tiếp
            docker exec -i "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" < "$selected_file"
        fi
    fi
    
    # Kiểm tra kết quả
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Import thành công!${NC}"
    else
        echo -e "${RED}Import thất bại!${NC}"
    fi
}

# Liệt kê các bản sao lưu
list_backups() {
    if [ ! "$(ls -A "$BACKUP_DIR")" ]; then
        echo -e "${YELLOW}Không có bản sao lưu nào.${NC}"
        return
    fi
    
    echo -e "${YELLOW}Danh sách các bản sao lưu:${NC}"
    
    # Liệt kê các file backup với số thứ tự, kích thước và thời gian
    local count=1
    for file in "$BACKUP_DIR"/*; do
        # Lấy kích thước file
        size=$(du -h "$file" | cut -f1)
        
        # Xác định nguồn (local hay docker)
        source_type=""
        if [[ "$(basename "$file")" == *"_local_"* ]]; then
            source_type="${GREEN}[Local]${NC}"
        elif [[ "$(basename "$file")" == *"_docker_"* ]]; then
            source_type="${BLUE}[Docker]${NC}"
        fi
        
        # Lấy thời gian tạo file
        if [[ "$file" == *.gz ]]; then
            # Trích xuất timestamp từ tên file
            timestamp=$(basename "$file" | sed -E 's/.*_([0-9]{8}_[0-9]{6})\.sql\.gz/\1/')
            formatted_time=$(echo "$timestamp" | sed -E 's/([0-9]{4})([0-9]{2})([0-9]{2})_([0-9]{2})([0-9]{2})([0-9]{2})/\1-\2-\3 \4:\5:\6/')
        else
            # Trích xuất timestamp từ tên file
            timestamp=$(basename "$file" | sed -E 's/.*_([0-9]{8}_[0-9]{6})\.sql/\1/')
            formatted_time=$(echo "$timestamp" | sed -E 's/([0-9]{4})([0-9]{2})([0-9]{2})_([0-9]{2})([0-9]{2})([0-9]{2})/\1-\2-\3 \4:\5:\6/')
        fi
        
        echo -e "${BLUE}$count)${NC} $(basename "$file") ${YELLOW}[$size]${NC} ${source_type} ${GREEN}[$formatted_time]${NC}"
        ((count++))
    done
    echo
}

# Xóa bản sao lưu
delete_backup() {
    # Liệt kê các file backup
    echo -e "${YELLOW}Các bản sao lưu có sẵn:${NC}"
    list_backups
    
    # Nếu không có file backup nào
    if [ ! "$(ls -A "$BACKUP_DIR")" ]; then
        echo -e "${RED}Không tìm thấy bản sao lưu nào.${NC}"
        return
    fi
    
    # Yêu cầu người dùng chọn file
    echo -n "Nhập số thứ tự của bản sao lưu muốn xóa (hoặc 0 để hủy): "
    read -r choice
    
    # Kiểm tra lựa chọn
    if [ "$choice" = "0" ]; then
        echo -e "${YELLOW}Đã hủy thao tác xóa.${NC}"
        return
    fi
    
    # Lấy danh sách file backup
    backup_files=("$BACKUP_DIR"/*)
    
    # Kiểm tra lựa chọn có hợp lệ không
    if ! [[ "$choice" =~ ^[0-9]+$ ]] || [ "$choice" -lt 1 ] || [ "$choice" -gt "${#backup_files[@]}" ]; then
        echo -e "${RED}Lựa chọn không hợp lệ.${NC}"
        return
    fi
    
    # Lấy file backup được chọn
    selected_file="${backup_files[$choice-1]}"
    
    # Xác nhận trước khi xóa
    echo -n "Bạn có chắc chắn muốn xóa $(basename "$selected_file")? (y/n): "
    read -r confirm
    
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo -e "${YELLOW}Đã hủy thao tác xóa.${NC}"
        return
    fi
    
    # Xóa file
    rm "$selected_file"
    
    # Kiểm tra kết quả
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Đã xóa thành công!${NC}"
    else
        echo -e "${RED}Xóa thất bại!${NC}"
    fi
}

# Chuyển đổi chế độ
toggle_mode() {
    if [ "$USE_LOCAL" = true ]; then
        USE_LOCAL=false
        echo -e "${GREEN}Đã chuyển sang chế độ Docker Container.${NC}"
    else
        USE_LOCAL=true
        echo -e "${GREEN}Đã chuyển sang chế độ Local MySQL.${NC}"
    fi
}

# Cấu hình kết nối
configure_connection() {
    if [ "$USE_LOCAL" = true ]; then
        echo -e "${YELLOW}Cấu hình kết nối MySQL Local:${NC}"
        
        echo -n "Host [$LOCAL_DB_HOST]: "
        read -r input
        [ -n "$input" ] && LOCAL_DB_HOST="$input"
        
        echo -n "Port [$LOCAL_DB_PORT]: "
        read -r input
        [ -n "$input" ] && LOCAL_DB_PORT="$input"
        
        echo -n "User [$LOCAL_DB_USER]: "
        read -r input
        [ -n "$input" ] && LOCAL_DB_USER="$input"
        
        echo -n "Password [$LOCAL_DB_PASSWORD]: "
        read -r -s input
        echo
        [ -n "$input" ] && LOCAL_DB_PASSWORD="$input"
        
        echo -n "Database [$LOCAL_DB_NAME]: "
        read -r input
        [ -n "$input" ] && LOCAL_DB_NAME="$input"
        
        echo -e "${GREEN}Đã cập nhật cấu hình kết nối MySQL Local.${NC}"
    else
        echo -e "${YELLOW}Cấu hình kết nối Docker:${NC}"
        
        echo -n "Container [$DB_CONTAINER]: "
        read -r input
        [ -n "$input" ] && DB_CONTAINER="$input"
        
        echo -n "User [$DB_USER]: "
        read -r input
        [ -n "$input" ] && DB_USER="$input"
        
        echo -n "Password [$DB_PASSWORD]: "
        read -r -s input
        echo
        [ -n "$input" ] && DB_PASSWORD="$input"
        
        echo -n "Database [$DB_NAME]: "
        read -r input
        [ -n "$input" ] && DB_NAME="$input"
        
        echo -e "${GREEN}Đã cập nhật cấu hình kết nối Docker.${NC}"
    fi
}

# Main program
main() {
    show_banner
    
    while true; do
        show_menu
        read -r choice
        
        case $choice in
            1) export_database ;;
            2) import_database ;;
            3) list_backups ;;
            4) delete_backup ;;
            5) toggle_mode ;;
            6) configure_connection ;;
            7) echo -e "${GREEN}Cảm ơn bạn đã sử dụng công cụ!${NC}"; exit 0 ;;
            *) echo -e "${RED}Lựa chọn không hợp lệ. Vui lòng thử lại.${NC}" ;;
        esac
        
        echo
        echo -n "Nhấn Enter để tiếp tục..."
        read -r
        clear
        show_banner
    done
}

# Bắt đầu chương trình
main