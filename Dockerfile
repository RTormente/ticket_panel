FROM node:26-trixie AS builder

WORKDIR /app

COPY package*.json ./

ARG NODE_ENV=production

RUN if [ "$NODE_ENV" = "development" ]; then \
        npm ci; \
    else \
        npm ci --omit=dev; \
    fi

COPY . .

FROM node:26-trixie-slim AS runner

WORKDIR /app

ARG NODE_ENV=production

ENV NODE_ENV=$NODE_ENV
ENV PORT=3000

COPY --from=builder /app ./

EXPOSE 3000

CMD ["npm", "start"]