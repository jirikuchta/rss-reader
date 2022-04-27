FROM python:3.8-slim-buster

RUN apt-get update && apt-get install -y build-essential python-dev

COPY app /rss_reader
COPY tests /tests
COPY requirements.txt /requirements.txt

RUN pip install -r requirements.txt
RUN pip install pytest

WORKDIR rss_reader
