FROM node:12-alpine

COPY ./frontend /rss-reader

WORKDIR /rss-reader

RUN npm install --loglevel=error

CMD ["npm", "run", "build"]
