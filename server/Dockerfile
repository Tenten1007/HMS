# Dockerfile for HMS server (Express/TypeScript)
FROM node:20-alpine

# Install Chromium and dependencies
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROME_BIN=/usr/bin/chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Install required packages
RUN apk update && apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-thai \
    nodejs \
    dumb-init

# Create directories and set permissions
RUN mkdir -p /app \
    && mkdir -p /dev/shm \
    && mkdir -p /tmp/chromium \
    && chmod 1777 /dev/shm \
    && chmod 1777 /tmp/chromium

# Set environment variables for Chromium
ENV CHROME_PATH=/usr/bin/chromium
ENV CHROMIUM_FLAGS="--headless --disable-gpu --no-sandbox --disable-dev-shm-usage --disable-software-rasterizer"

# Create a non-privileged user
RUN addgroup -S pptruser && adduser -S -g pptruser pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app \
    && chown -R pptruser:pptruser /dev/shm \
    && chown -R pptruser:pptruser /tmp/chromium

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

RUN npm run build

# Switch to pptruser
USER pptruser

EXPOSE 3001

ENV NODE_ENV=production
CMD ["dumb-init", "--", "node", "dist/index.js"]

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

RUN npm run build

# Switch to pptruser but keep necessary permissions
USER pptruser

EXPOSE 3001

ENV NODE_ENV=production
# Start Xvfb and the Node application
CMD Xvfb :99 -screen 0 1024x768x16 & node dist/index.js