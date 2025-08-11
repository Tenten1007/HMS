# Dockerfile for HMS server (Express/TypeScript)
FROM node:20-slim

# Install Chrome and dependencies
ENV CHROME_BIN=/usr/bin/google-chrome-stable

RUN apt-get update \
    && apt-get install -y wget gnupg2 \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y \
    google-chrome-stable \
    fonts-liberation \
    fonts-thai-tlwg \
    xvfb \
    && google-chrome --version \
    && rm -rf /var/lib/apt/lists/*

# Add Chrome as a user
RUN groupadd -r chrome && useradd -r -g chrome -G audio,video chrome \
    && mkdir -p /home/chrome/Downloads \
    && chown -R chrome:chrome /home/chrome

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

RUN npm run build

# Switch to chrome user
USER chrome

EXPOSE 3001
CMD ["node", "dist/index.js"] 