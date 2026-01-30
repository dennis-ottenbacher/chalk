FROM node:20-alpine

WORKDIR /app

# Set ownership of the working directory to the 'node' user
RUN chown node:node /app

# Switch to non-root user
USER node

# Install dependencies based on package.json
COPY --chown=node:node package*.json ./
# Use --legacy-peer-deps or similar if needed, but standard install usually fine.
# We run install inside image to build the base layer
RUN npm install

# Copy source is not strictly needed if we bind mount, but good for production build simulation
COPY --chown=node:node . .

# Expose Next.js port
EXPOSE 3000

# Start command (can be overridden by compose)
CMD ["npm", "run", "dev"]
