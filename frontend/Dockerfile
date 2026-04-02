# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:25-alpine AS build

WORKDIR /app

# Abhängigkeiten cachen
COPY package*.json ./
RUN npm ci --frozen-lockfile

# Quellcode kopieren
COPY . .

# Build-Argument für API-URL
ARG VITE_API_BASE_URL=http://localhost:8080/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Produktions-Build
RUN npm run build

# ── Stage 2: Serve mit nginx ─────────────────────────────────────────────────
FROM nginx:1.25-alpine AS production

# Sicherheits-Header & optimierte nginx-Konfiguration
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Statische Dateien aus Build-Stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
