FROM node:20-alpine
RUN addgroup -S appuser && adduser -S appuser -G appuser
WORKDIR /app
COPY shared /app/shared
WORKDIR /app/shared
RUN npm install --omit=dev
COPY order-service/package.json /app/order-service/
WORKDIR /app/order-service
RUN npm install --omit=dev
COPY order-service/server.js /app/order-service/
RUN chown -R appuser:appuser /app
USER appuser
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
