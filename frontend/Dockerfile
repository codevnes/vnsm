FROM node:18-alpine AS builder

WORKDIR /app

# Cài đặt các dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Cấu hình Next.js để đảm bảo output standalone
RUN if ! grep -q '"output": "standalone"' next.config.js; then     sed -i 's/const nextConfig = {/const nextConfig = {\n  output: "standalone",/' next.config.js; fi

# Build ứng dụng
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build

# Production image
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Thêm user non-root cho bảo mật
RUN addgroup --system --gid 1001 nodejs &&     adduser --system --uid 1001 nextjs

# Đảm bảo các thư mục tồn tại và có quyền truy cập đúng
RUN mkdir -p /app/.next/cache &&     chown -R nextjs:nodejs /app

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
