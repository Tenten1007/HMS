# Use Node.js 18 LTS with Alpine Linux for smaller image size
FROM node:18-alpine

# Install Chrome dependencies for Alpine Linux
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Chrome executable path for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV CHROME_BIN=/usr/bin/chromium-browser

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd client && npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build:server
RUN cd client && npm run build

# Copy templates to the dist directory
RUN cp -r server/templates server/dist/

# Expose the port
EXPOSE 3000

# Start the application
CMD ["node", "server/dist/index.js"]