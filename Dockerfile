# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY package*.json ./
RUN npm install
COPY . ./
RUN npm run build

# Stage 2: Backend Node.js
FROM node:20-alpine
WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/prisma ./prisma/
RUN npx prisma generate

COPY backend/tsconfig.json ./
COPY backend/src ./src/
RUN npm run build

# Frontend buildado -> /app/static/
COPY --from=frontend-build /frontend/dist ./static

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed.ts && node dist/index.js"]
