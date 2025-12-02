FROM node:20-slim

WORKDIR /app

# Install dependencies for Baileys
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY whatsapp-qr-service/package*.json ./

RUN npm install

COPY whatsapp-qr-service/ .

RUN npm run build

# Create sessions directory
RUN mkdir -p /app/sessions && chmod 777 /app/sessions

EXPOSE 3002

VOLUME ["/app/sessions"]

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["npm", "start"]
