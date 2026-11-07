FROM node:24-slim AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN corepack install
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN corepack install
RUN pnpm install --prod --frozen-lockfile
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]