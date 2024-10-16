# Dockerfile
FROM node:14
WORKDIR /order-service
COPY package*.json ./
RUN npm install
COPY ./src ./src
CMD ["node", "src/index.js"]
