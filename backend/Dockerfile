FROM node:20-alpine

WORKDIR /app

# Cài đặt các dependencies cần thiết
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Tạo thư mục uploads nếu chưa tồn tại
RUN mkdir -p public/uploads

# Generate Prisma client
RUN npx prisma generate

# Build ứng dụng
RUN npm run build

# Sao chép thư mục generated Prisma vào dist
RUN mkdir -p dist/generated && cp -r src/generated/prisma dist/generated/

# Expose port
EXPOSE 3001

# Khởi động ứng dụng
CMD ["npm", "start"]