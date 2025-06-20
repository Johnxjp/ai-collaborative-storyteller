FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app

COPY package*.json ./

RUN npm ci

FROM base AS builder
WORKDIR /app

# Accept build arguments
ARG NEXT_PUBLIC_ELEVENLABS_API_KEY
ARG NEXT_PUBLIC_ELEVENLABS_CONVERSATION_AGENT_ID
ARG NEXT_PUBLIC_BACKEND_URL

# Set as environment variables for the build
ENV NEXT_PUBLIC_ELEVENLABS_API_KEY=$NEXT_PUBLIC_ELEVENLABS_API_KEY
ENV NEXT_PUBLIC_ELEVENLABS_CONVERSATION_AGENT_ID=$NEXT_PUBLIC_ELEVENLABS_CONVERSATION_AGENT_ID
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]