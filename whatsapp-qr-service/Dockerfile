FROM node:20-alpine

WORKDIR /app

COPY whatsapp-qr-service/package*.json ./

RUN npm install

COPY whatsapp-qr-service/ .

RUN npm run build

EXPOSE 3002

VOLUME ["/app/sessions"]

CMD ["npm", "start"]
