FROM node:16.13.1

WORKDIR /usr/src/app

COPY package*.json yarn.lock ./

RUN yarn --pure-lockfile

COPY . .

EXPOSE 80


CMD yarn build && yarn start
