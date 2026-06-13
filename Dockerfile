# Excellent Motors — production image.
FROM node:22-alpine AS base
# openssl + libc6-compat are needed by Prisma's query engine on Alpine.
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# ── Dependencies ──────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# ── Build ─────────────────────────────────────────────────────────────────────
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
# A DATABASE_URL is only needed at runtime; a dummy keeps the build happy.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Runtime ───────────────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh
EXPOSE 3000
# Applies migrations (and seeds an empty DB) before starting the server.
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
