FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

RUN mkdir -p ./.next
RUN ln -s /tmp/ /usr/src/app/.next/cache

RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
