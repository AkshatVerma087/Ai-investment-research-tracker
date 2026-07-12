FROM node:20-alpine

# Install openssl for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy Prisma schema and code
COPY prisma ./prisma
COPY . .

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 5000

# Start server
CMD ["npm", "start"]
