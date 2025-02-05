# Use Node.js LTS as the base image
FROM node:lts

# Set environment variable for MongoDB (can be overridden at runtime)
ENV MONGODB_URI="mongodb://${DOCDB_USERNAME}:${DOCDB_PASSWORD}@${DOCDB_CLUSTER_ENDPOINT}:27017/${DOCDB_DATABASE}?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"

# Set up client
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY ./ ./

# Set up server
WORKDIR /workspace
COPY package.json package-lock.json ./
RUN npm install
COPY api/ ./api/
COPY config/ ./config/
COPY models/ ./models/
COPY agents/ ./agents/
COPY server/ ./server/

# Create start script
RUN echo '#!/bin/sh\ncd /app && npm start &\ncd /workspace/server && npm start' > /start.sh && \
    chmod +x /start.sh

# Expose both ports
EXPOSE 3000 3001

# Start both services
CMD ["/start.sh"]