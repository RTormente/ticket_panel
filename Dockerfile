FROM node:26-bookworm-slim

WORKDIR /app

COPY . .

RUN npm ci

ENV NODE_ENV=development
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
