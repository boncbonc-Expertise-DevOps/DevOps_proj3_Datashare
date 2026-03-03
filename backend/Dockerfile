FROM node:22-bookworm-slim AS build

WORKDIR /app

# deps
COPY package.json package-lock.json ./
RUN npm ci

# sources
COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src

# build
RUN npm run build

# keep only prod deps for runtime image
RUN npm prune --omit=dev


FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json package-lock.json ./

# Local storage directory expected by the app (process.cwd()/uploads)
RUN mkdir -p /app/uploads

EXPOSE 3000

CMD ["node", "dist/main"]
