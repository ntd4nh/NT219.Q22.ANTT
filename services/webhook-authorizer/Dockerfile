FROM node:20-alpine
RUN addgroup -S appuser && adduser -S appuser -G appuser
WORKDIR /app
COPY shared /app/shared
WORKDIR /app/shared
RUN npm install --omit=dev
COPY webhook-authorizer/package.json /app/webhook-authorizer/
WORKDIR /app/webhook-authorizer
RUN npm install --omit=dev
COPY webhook-authorizer/server.js /app/webhook-authorizer/
RUN chown -R appuser:appuser /app
USER appuser
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
