FROM node:18-alpine3.17

WORKDIR /usr/app

COPY package*.json /usr/app/

RUN npm install
RUN apk add bash

COPY . .

ENV MONO_URI=mongodb://localhost:27017/superData
ENV MONGO_DB=superData
ENV MONGO_COLLECTION=planets
ENV S3_MONGO_DB_KEY=superData.planets.json
ENV S3_MONGO_ACCESS_KEY=global-bundle.pem

EXPOSE 3000

CMD [ "npm", "start" ]