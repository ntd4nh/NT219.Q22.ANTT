FROM node:20-alpine
WORKDIR /app
COPY shared /app/shared
WORKDIR /app/shared
RUN npm install --omit=dev
COPY billing-service/package.json /app/billing-service/
WORKDIR /app/billing-service
RUN npm install --omit=dev
COPY billing-service/server.js /app/billing-service/
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
