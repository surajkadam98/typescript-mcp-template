FROM node:20-slim

WORKDIR /app

COPY package*.json ./
# RUN npm ci --only=production
RUN npm install

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm install --save-dev typescript @types/node && \
    npm run build && \
    npm prune --production

CMD ["node", "dist/index.js"]
