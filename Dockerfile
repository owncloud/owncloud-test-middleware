FROM node:16-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY yarn.lock ./
COPY data ./data
COPY src ./src
COPY filesForUpload ./filesForUpload

RUN yarn

EXPOSE 3000

CMD [ "npm", "start" ]
