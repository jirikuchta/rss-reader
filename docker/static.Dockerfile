FROM node:18-alpine

COPY static /rss_reader

WORKDIR /rss_reader

RUN npm install --loglevel=error
