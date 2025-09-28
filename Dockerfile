FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile || pnpm install
COPY src ./src
ENTRYPOINT ["pnpm", "run", "start"]