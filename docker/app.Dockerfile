FROM python:3.8-slim-buster

RUN apt-get update && apt-get install -y build-essential python-dev libpcre3-dev

COPY app /rss_reader/app
COPY templates /rss_reader/templates
COPY static /rss_reader/static
COPY requirements.txt /rss_reader/requirements.txt

RUN pip install -r /rss_reader/requirements.txt

WORKDIR /rss_reader/app

EXPOSE 5000

CMD ["uwsgi", "uwsgi.ini"]
