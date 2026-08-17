# Production image for the ITAP SPA: build the static bundle with Vite, then serve it with
# nginx (which also proxies /api and /socket.io to the API). See docs/09-deployment-guide.md.
#
# NOTE: Vite inlines VITE_* vars at BUILD time, so the per-environment values below must be
# passed as build args, e.g.:
#   docker build \
#     --build-arg VITE_SUPABASE_URL=https://xxx.supabase.co \
#     --build-arg VITE_SUPABASE_ANON_KEY=eyJ... \
#     -t itap-frontend ./frontend
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Same-origin defaults: nginx below proxies these paths to the API, so the shipped bundle
# needs no absolute API/socket URLs. Supabase values have no safe default — pass them in.
ARG VITE_API_BASE_URL=/api
ARG VITE_SOCKET_URL=/
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_SOCKET_URL=$VITE_SOCKET_URL \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
RUN npm run build

FROM nginx:1.27-alpine AS runtime
# Drop the default site; ship ours (SPA fallback + API/websocket proxy + caching headers).
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/itap.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
