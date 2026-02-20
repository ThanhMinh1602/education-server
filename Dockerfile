# 1. Sử dụng môi trường Node.js phiên bản Alpine (siêu nhẹ, giúp giảm chi phí và thời gian deploy)
FROM node:20-alpine

# 2. Tạo thư mục làm việc bên trong container
WORKDIR /app

# 3. Copy 2 file quản lý thư viện vào trước
COPY package*.json ./

# 4. Cài đặt các thư viện cần thiết (chỉ cài dependencies, bỏ qua devDependencies để nhẹ máy)
RUN npm install --production

# 5. Copy toàn bộ source code còn lại vào container
COPY . .

# 6. Mở cổng 8080 (Google Cloud Run mặc định sẽ gọi vào cổng này)
EXPOSE 8080

# 7. Lệnh khởi chạy ứng dụng khi container bắt đầu hoạt động
CMD ["npm", "start"]