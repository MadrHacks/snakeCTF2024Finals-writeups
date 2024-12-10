FROM node:18-alpine

WORKDIR /usr/src/app
COPY . .
RUN npm ci

EXPOSE 3002
CMD ["node", "index.js"]
