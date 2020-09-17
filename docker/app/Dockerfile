FROM python:3.8-slim-buster

COPY ./rss_reader /rss_reader
RUN chown -R www-data:www-data /rss_reader

RUN apt-get update && \
	apt-get install -y build-essential nginx
RUN pip install -r rss_reader/requirements.txt

EXPOSE 5000

ENTRYPOINT ["uwsgi", "/rss_reader/app.ini"]
