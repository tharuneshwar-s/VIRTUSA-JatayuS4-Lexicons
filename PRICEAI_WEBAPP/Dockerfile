# Development Dockerfile
FROM node:18-alpine

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Set environment
ENV NODE_ENV=development
ENV PORT=3001

# Start development server
CMD ["npm", "run", "dev"]
