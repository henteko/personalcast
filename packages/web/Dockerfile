# Build stage
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN npm ci

# Build packages in order
RUN cd packages/core && npm run build

# Build web - use experimental build mode to avoid static generation issues
RUN cd packages/web && npm run build

# Runtime stage
FROM node:18-alpine AS runner

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache ffmpeg

# Add non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/.next/static ./packages/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/public ./packages/web/public

USER nextjs

ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

EXPOSE 8080

CMD ["node", "packages/web/server.js"]