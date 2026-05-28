# ──────────────────────────────────────────────
# Dockerfile - CookieClicker (Next.js)
# ──────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npx next build

EXPOSE 3000

CMD ["npm", "start"]
