FROM node:20-alpine

WORKDIR /app

# Cài đặt các dependencies cần thiết và MySQL client
RUN apk add --no-cache mysql-client

COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Tạo thư mục uploads nếu chưa tồn tại
RUN mkdir -p public/uploads

# Generate Prisma client
RUN npx prisma generate

# Thêm script để chạy Prisma migrate khi container khởi động
COPY ./docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Build ứng dụng
RUN npm run build

# Không cần sao chép thư mục generated Prisma vì chúng ta đã sử dụng @prisma/client

# Expose port
EXPOSE 3001

# Khởi động ứng dụng
CMD ["/app/docker-entrypoint.sh"]