# Use the official Bun image
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies into a temp directory
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Copy production dependencies and source code into final image
FROM base AS release
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Expose the port and run the app
EXPOSE 8081
CMD ["bun", "run", "server.ts"]