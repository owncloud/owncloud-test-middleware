FROM node:16-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY yarn.lock ./
COPY data ./data
COPY src ./src
COPY filesForUpload ./filesForUpload
COPY dev/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh
RUN yarn

EXPOSE 3000

CMD [ "sh", "-c", "/entrypoint.sh" ]
