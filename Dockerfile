FROM python:3.7-alpine

COPY ./ /rss_reader

WORKDIR /rss_reader

RUN pip install -r requirements.txt

EXPOSE 5000
