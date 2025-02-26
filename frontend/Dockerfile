FROM --platform=linux/amd64 node:16-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies for build
RUN npm install

# Install missing babel plugin
RUN npm install --save-dev @babel/plugin-proposal-private-property-in-object

# Copy source code
COPY . .

# Build the production version
RUN npm run build

# Clean up dev dependencies
RUN npm prune --omit=dev

# Install serve to run production build
RUN npm install -g serve

# Copy and make entrypoint script executable
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"] 