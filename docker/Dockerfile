FROM node:18-buster AS static
WORKDIR /rss_reader
COPY static .
RUN npm install && npm run build


FROM python:3.8-slim-buster

COPY app /rss_reader/app
COPY templates /rss_reader/templates
COPY requirements.txt /rss_reader/requirements.txt
COPY static/favicon /rss_reader/static/favicon
COPY --from=static /rss_reader/app.js /rss_reader/static/app.js
COPY --from=static /rss_reader/app.css /rss_reader/static/app.css

RUN apt-get update && apt-get install -y build-essential
RUN pip install -r /rss_reader/requirements.txt

WORKDIR /rss_reader/app

EXPOSE 80

CMD ["uwsgi", "uwsgi.ini"]
