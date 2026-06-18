#!/bin/bash

# AetherCore Production Build Script
# Executes a clean build and optimizes the output for deployment

echo "Starting AetherCore production build..."

# Clean previous builds
echo "Cleaning dist/ directory..."
rm -rf dist/

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "node_modules not found. Installing dependencies..."
  npm install
fi

# Run the build script defined in package.json
# This runs: vite build && esbuild server.ts --bundle ...
echo "Running build command..."
npm run build

if [ $? -eq 0 ]; then
  echo "Build successful! Production artifacts are ready in dist/"

  # Optimization: Ensure dist/ index.html exists for static hosting
  if [ -f "dist/index.html" ]; then
    echo "Optimization: Verified dist/index.html"
  else
    echo "Warning: dist/index.html not found!"
  fi

  # Optimization: Ensure dist/server.cjs exists for backend deployment
  if [ -f "dist/server.cjs" ]; then
    echo "Optimization: Verified dist/server.cjs"
  else
    echo "Warning: dist/server.cjs not found!"
  fi

else
  echo "Build failed!"
  exit 1
fi
