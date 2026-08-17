# Production image for the ITAP API (and worker — same image, different CMD).
# Multi-stage: install prod deps in a builder, copy into a slim runtime that runs as a
# non-root user. See docs/09-deployment-guide.md.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
# `npm ci` = reproducible install from the lockfile; omit dev deps for a lean image.
RUN npm ci --omit=dev

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Run as the built-in unprivileged `node` user rather than root.
COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node . .

# dumb-init reaps zombies and forwards SIGTERM so graceful shutdown works under an orchestrator.
RUN apk add --no-cache dumb-init
USER node

EXPOSE 4000

# Container-level liveness check hitting the app's /health route.
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:4000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
