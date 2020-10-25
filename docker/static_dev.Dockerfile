FROM node:12-alpine

COPY /rss_reader/static /rss_reader

WORKDIR /rss_reader

RUN npm install --loglevel=error
