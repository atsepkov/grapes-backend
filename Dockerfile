FROM oven/bun:1.0.0-slim

WORKDIR /app
COPY . .

RUN bun install

CMD ["bun", "run", "server.ts"]