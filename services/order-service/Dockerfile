FROM node:20-alpine
WORKDIR /app
COPY shared /app/shared
WORKDIR /app/shared
RUN npm install --omit=dev
COPY order-service/package.json /app/order-service/
WORKDIR /app/order-service
RUN npm install --omit=dev
COPY order-service/server.js /app/order-service/
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
