# Multi-stage build for combined Next.js app and video server

FROM node:18-alpine AS base

# Stage 1: Install Next.js dependencies
FROM base AS nextjs-deps
WORKDIR /app/nextjs-app
COPY nextjs-app/package*.json ./
RUN npm install

# Stage 2: Build Next.js app
FROM base AS nextjs-builder
WORKDIR /app/nextjs-app
COPY --from=nextjs-deps /app/nextjs-app/node_modules ./node_modules
COPY nextjs-app/ .
RUN npm run build

# Stage 3: Install video server dependencies
FROM base AS video-server-deps
WORKDIR /app/video-server
COPY video-server/package*.json ./
RUN npm install --production

# Stage 4: Final production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV VIDEO_SERVER_PORT=8080

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy Next.js app
WORKDIR /app/nextjs-app
COPY --from=nextjs-builder --chown=nextjs:nodejs /app/nextjs-app/.next/standalone ./
COPY --from=nextjs-builder --chown=nextjs:nodejs /app/nextjs-app/.next/static ./.next/static
RUN mkdir -p public || true

# Copy video server
WORKDIR /app/video-server
COPY --from=video-server-deps /app/video-server/node_modules ./node_modules
COPY --chown=nextjs:nodejs video-server/ ./
RUN mkdir -p videos

# Create startup script to run both services
WORKDIR /app
RUN echo '#!/bin/sh' > start.sh && \
    echo 'set -e' >> start.sh && \
    echo 'cd /app/video-server && node server.js &' >> start.sh && \
    echo 'VIDEO_PID=$!' >> start.sh && \
    echo 'cd /app/nextjs-app && node server.js &' >> start.sh && \
    echo 'NEXTJS_PID=$!' >> start.sh && \
    echo 'trap "kill $VIDEO_PID $NEXTJS_PID" EXIT' >> start.sh && \
    echo 'wait' >> start.sh && \
    chmod +x start.sh && \
    chown nextjs:nodejs start.sh

USER nextjs

EXPOSE 3000

CMD ["/bin/sh", "/app/start.sh"]
