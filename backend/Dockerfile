FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
EXPOSE 4001

# Wait for MySQL to accept connections, apply the schema, then start the API.
CMD sh -c "node src/wait-for-db.js && node src/migrate.js && node src/index.js"
