FROM node:18-alpine

USER node

WORKDIR /home/node
COPY static/package.json .
RUN npm install --loglevel error
ENV PATH=$PATH:/home/node/node_modules/.bin

WORKDIR ./rss_reader
