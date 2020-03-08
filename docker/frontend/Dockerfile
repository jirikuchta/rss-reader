FROM node:13.8.0

COPY ./frontend /rss-reader

WORKDIR /rss-reader

RUN npm install

CMD ["npm", "run", "build"]
