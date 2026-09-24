FROM node:26-bookworm-slim

WORKDIR /app

COPY . .

ARG NODE_ENV=production

RUN if [ "$NODE_ENV" = "development" ]; then \
        npm ci; \
    else \
        npm ci --omit=dev; \
    fi

ENV NODE_ENV=$NODE_ENV
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
