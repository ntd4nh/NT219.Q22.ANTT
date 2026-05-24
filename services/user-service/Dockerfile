FROM node:20-alpine
WORKDIR /app
COPY shared /app/shared
WORKDIR /app/shared
RUN npm install --omit=dev
COPY user-service/package.json /app/user-service/
WORKDIR /app/user-service
RUN npm install --omit=dev
COPY user-service/server.js /app/user-service/
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
