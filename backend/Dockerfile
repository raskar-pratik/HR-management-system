# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
# Copy migration scripts if needed (assuming they are TS and run via ts-node, might need ts-node in prod or compile them)
# For simplicity, if migrations are TS, we might need a different strategy or compile them.
# Let's verify if `src/migrations` exists and how `npm run migrate` works.
# Package.json says: "migrate": "ts-node src/migrations/run.ts"
# This implies we need ts-node in production OR we need to compile migrations.
# To allow "npm run migrate" to work in the container without devDependencies, 
# we should probably copy the source for now or ensure ts-node is available,
# OR strictly speaking, we should compile everything.
# Given the setup, I'll stick to a simpler approach: copying the built dist is good, 
# but for migrations, we might need the source or compile them.
# Let's assume we can run migrations from the built JS if we compile them, 
# but "src/migrations" might not be in "dist" if "include" in tsconfig is just "src".
# A comprehensive build usually includes everything. 
# For this MVP docker setup, let's keep it simple:
# We will use the 'builder' stage to run migrations if we wanted, but typically we run them on startup.
# We will copy the source code too if we want to use ts-node, OR better, 
# let's install ts-node in production or just start the server.
# The standard "npm start" runs "node dist/server.js". This is fine.
# We will configure the command to just start the server. Migrations can be run separately or via a startup script.

COPY --from=builder /app/dist ./dist
# Copying migrations source just in case we use ts-node (though not ideal for pure prod)
COPY --from=builder /app/src/migrations ./src/migrations
COPY --from=builder /app/tsconfig.json ./

# Install ts-node globally just to run migrations if needed, or rely on built js
RUN npm install -g ts-node typescript

EXPOSE 5000

CMD ["node", "dist/server.js"]
