FROM node:20-bookworm AS static
WORKDIR /rss_reader
COPY static .
RUN npm install && npm run build

FROM python:3.11-slim-bookworm

COPY app /rss_reader/app
COPY templates /rss_reader/templates
COPY requirements.txt /rss_reader/requirements.txt
COPY static/favicon /rss_reader/static/favicon
COPY static/manifest.json /rss_reader/static/manifest.json
COPY --from=static /rss_reader/app.js /rss_reader/static/app.js
COPY --from=static /rss_reader/app.css /rss_reader/static/app.css

RUN apt-get update && apt-get install -y --no-install-recommends build-essential
RUN pip install --no-cache-dir -r /rss_reader/requirements.txt

WORKDIR /rss_reader

RUN apt-get install -y --no-install-recommends nodejs npm
RUN npm install @mozilla/readability jsdom
COPY bin/full-content.js /rss_reader/bin/full-content.js

WORKDIR /rss_reader/app

EXPOSE 80

CMD ["uwsgi", "uwsgi.ini"]
