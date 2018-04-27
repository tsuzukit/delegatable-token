FROM node:9.5.0-alpine

WORKDIR /var/app/

RUN apk update && apk add git python make g++ bash

RUN npm install

ENTRYPOINT tail -f /dev/null
#ENTRYPOINT node app.js

