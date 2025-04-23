#!/bin/bash

# Thông tin cơ sở dữ liệu
DB_CONTAINER="vnsm-mysql"
DB_USER="root"
DB_PASSWORD="Timem.2302"
DB_NAME="vsmi_db"
BACKUP_DIR="./database/backups"

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
    echo -e "${YELLOW}Chọn một tùy chọn:${NC}"
    echo "1) Export database (sao lưu)"
    echo "2) Import database (khôi phục)"
    echo "3) Liệt kê các bản sao lưu"
    echo "4) Xóa bản sao lưu"
    echo "5) Thoát"
    echo
    echo -n "Nhập lựa chọn của bạn [1-5]: "
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
    check_mysql_container
    
    # Tạo tên file backup với timestamp
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql"
    
    echo -e "${YELLOW}Đang export database ${DB_NAME}...${NC}"
    
    # Thực hiện lệnh export
    docker exec "$DB_CONTAINER" mysqldump -u"$DB_USER" -p"$DB_PASSWORD" --databases "$DB_NAME" > "$BACKUP_FILE"
    
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
    check_mysql_container
    
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
    
    echo -e "${YELLOW}Đang import database từ ${selected_file}...${NC}"
    
    # Kiểm tra xem file có phải là file nén không
    if [[ "$selected_file" == *.gz ]]; then
        # Giải nén file và import
        gunzip -c "$selected_file" | docker exec -i "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD"
    else
        # Import trực tiếp
        docker exec -i "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" < "$selected_file"
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
        
        echo -e "${BLUE}$count)${NC} $(basename "$file") ${YELLOW}[$size]${NC} ${GREEN}[$formatted_time]${NC}"
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
            5) echo -e "${GREEN}Cảm ơn bạn đã sử dụng công cụ!${NC}"; exit 0 ;;
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