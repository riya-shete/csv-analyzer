# ----------- Build Stage -----------
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

RUN npm ci

# Copy source files
COPY . .

# Build with backend API URL
ENV VITE_API_URL=http://csvanalysis-backend-9u5tnu-3e9c9e-72-61-227-173.traefik.me/api

RUN npm run build


# ----------- Production Stage -----------
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

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