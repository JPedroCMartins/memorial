FROM ghcr.io/cirruslabs/flutter:stable AS builder


WORKDIR /app

# Copy pubspec files first for better caching                              
COPY pubspec.yaml pubspec.lock ./
RUN flutter pub get

# Copy source code
COPY . .

# Build for web (release mode)
RUN flutter build web --release --no-tree-shake-icons

# Production stage - use nginx to serve static files
FROM docker.io/library/nginx:alpine

# Copy built web app
COPY --from=builder /app/build/web /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8051

CMD ["nginx", "-g", "daemon off;"]

