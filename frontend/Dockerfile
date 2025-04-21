FROM node:20-alpine AS builder

WORKDIR /app

# Cài đặt các dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Thiết lập biến môi trường cho build
ENV NEXT_PUBLIC_API_URL=https://api.vsmi.vn
ENV NODE_ENV=production

# Build ứng dụng
RUN npm run build

# Giai đoạn production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Sao chép các file cần thiết từ giai đoạn build
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose port
EXPOSE 3000

# Thiết lập biến môi trường cho runtime
ENV NEXT_PUBLIC_API_URL=https://api.vsmi.vn
ENV PORT=3000

# Khởi động ứng dụng
CMD ["node", "server.js"]