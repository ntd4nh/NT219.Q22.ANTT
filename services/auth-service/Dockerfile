FROM node:20-alpine
WORKDIR /app
COPY shared /app/shared
WORKDIR /app/shared
RUN npm install --omit=dev
COPY auth-service/package.json /app/auth-service/
WORKDIR /app/auth-service
RUN npm install --omit=dev
COPY auth-service/server.js /app/auth-service/
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
