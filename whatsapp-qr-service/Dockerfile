FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3002

VOLUME ["/app/sessions"]

CMD ["npm", "start"]
