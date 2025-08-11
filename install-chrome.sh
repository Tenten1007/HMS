#!/bin/bash
set -e

echo "Starting Chrome installation..."

# Check if running as root or have sudo access
if [[ $EUID -eq 0 ]]; then
    echo "Running as root"
    APT_CMD=""
else
    echo "Using sudo for package management"
    APT_CMD="sudo"
fi

# Update package list
echo "Updating package list..."
$APT_CMD apt-get update

# Install dependencies first
echo "Installing dependencies..."
$APT_CMD apt-get install -y wget gnupg ca-certificates fonts-liberation

# Add Google Chrome repository
echo "Adding Chrome repository..."
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | $APT_CMD apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | $APT_CMD tee /etc/apt/sources.list.d/google.list

# Update package list with new repository
echo "Updating package list with Chrome repository..."
$APT_CMD apt-get update

# Install Google Chrome
echo "Installing Google Chrome..."
$APT_CMD apt-get install -y google-chrome-stable --no-install-recommends

echo "Chrome installation completed successfully!"

# Verify installation
if command -v google-chrome-stable &> /dev/null; then
    echo "Chrome version: $(google-chrome-stable --version)"
else
    echo "Chrome installation may have failed"
    exit 1
fi