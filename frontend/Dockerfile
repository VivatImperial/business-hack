# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --legacy-peer-deps

COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
