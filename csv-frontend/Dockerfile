# ----------- Build Stage -----------
FROM node:20-alpine AS build

WORKDIR /app

# Copy only frontend package files
COPY csv-frontend/package*.json ./

RUN npm ci

# Copy only frontend source code
COPY csv-frontend/ .

# Build with backend API URL
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build


# ----------- Production Stage -----------
FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy built frontend files
COPY --from=build /app/dist /usr/share/nginx/html

# SPA routing config
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
