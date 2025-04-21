FROM node:20-alpine

WORKDIR /app

# Cài đặt các dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build ứng dụng
RUN npm run build

# Expose port
EXPOSE 3000

# Khởi động ứng dụng
CMD ["npm", "start"]