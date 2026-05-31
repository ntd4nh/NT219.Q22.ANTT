FROM node:20-alpine
RUN addgroup -S appuser && adduser -S appuser -G appuser
WORKDIR /app
COPY shared /app/shared
WORKDIR /app/shared
RUN npm install --omit=dev
COPY user-service/package.json /app/user-service/
WORKDIR /app/user-service
RUN npm install --omit=dev
COPY user-service/server.js /app/user-service/
RUN chown -R appuser:appuser /app
USER appuser
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
