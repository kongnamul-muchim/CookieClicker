FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npx next build

# Copy public/ static files into standalone build
RUN cp -r public .next/standalone/

EXPOSE 3002

CMD ["node", ".next/standalone/server.js"]
