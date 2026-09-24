FROM node:26-bookworm-slim

WORKDIR /app

COPY . .

RUN npm ci --omit=dev

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
