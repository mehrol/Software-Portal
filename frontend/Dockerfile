FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose React dev server port
EXPOSE 3000

# Run development server
CMD ["npm", "start"]
