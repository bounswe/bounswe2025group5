## Simple single-stage image: build then serve with Vite preview on port 3000
FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Copy source and build
COPY . .
RUN npm run build

EXPOSE 3000

# Serve the built app via Vite preview on 0.0.0.0:3000
CMD ["npm", "run", "preview", "--", "--port", "3000", "--host", "0.0.0.0"]


