FROM node:12-alpine

COPY /app/static /app

WORKDIR /app

RUN npm install --loglevel=error
