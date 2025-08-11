# Dockerfile for HMS server (Express/TypeScript)
FROM node:20-slim

# Install Chromium and dependencies
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROME_BIN=/usr/bin/chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Create shared memory for Chromium
RUN mkdir -p /dev/shm

RUN apt-get update \
    && apt-get install -y \
    chromium \
    fonts-liberation \
    fonts-thai-tlwg \
    xvfb \
    && chromium --version \
    && rm -rf /var/lib/apt/lists/*

# Set up shared memory volume
VOLUME /dev/shm

# Add chrome user
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

RUN npm run build

# Switch to pptruser
USER pptruser

EXPOSE 3001

ENV NODE_ENV=production
CMD ["node", "dist/index.js"] 