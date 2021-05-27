FROM node:14-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY yarn.lock ./
COPY data ./data
COPY src ./src

RUN yarn

EXPOSE 3000

CMD [ "node", "src/index.js" ]
