# Gunakan Node.js base image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source code
COPY . .

# Expose port aplikasi
EXPOSE 8080

# Start the application
CMD [ "node", "server.js" ]
