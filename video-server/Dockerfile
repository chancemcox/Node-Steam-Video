FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY . .

# Create videos directory
RUN mkdir -p videos

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "server.js"]
