# ----------------------------------------------------
# Stage 1: Build & Compile TypeScript
# ----------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Install native build tools required for compiling bcrypt
RUN apk add --no-cache python3 make g++

# Copy package files and install all dependencies (including devDependencies)
COPY package*.json ./
RUN npm ci

# Copy source files and compile TypeScript to /dist
COPY . .
RUN npm run build

# ----------------------------------------------------
# Stage 2: Lean Production Runtime
# ----------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Install native build tools required for bcrypt in the runtime container
RUN apk add --no-cache python3 make g++

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled JavaScript output from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Run as built-in non-root user for security
USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]