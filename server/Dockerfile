# Multi-stage Dockerfile for Backend (Node.js + Prisma)
FROM node:20-alpine AS builder

WORKDIR /app

# Cài đặt OpenSSL cần thiết cho Prisma engine trên Alpine
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY src ./src

# Production Stage
FROM node:20-alpine AS runner

WORKDIR /app
RUN apk add --no-cache openssl curl

ENV NODE_ENV=production

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY src ./src

EXPOSE 5001

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:5001/api/health || exit 1

CMD ["node", "src/app.js"]
