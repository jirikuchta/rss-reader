FROM python:3.8-slim-buster

RUN apt-get update && apt-get install -y build-essential python-dev libpcre3-dev
COPY rss_reader /rss_reader
COPY requirements.txt /requirements.txt

RUN pip install -r requirements.txt

EXPOSE 5000

CMD ["uwsgi", "rss_reader/app.ini"]
