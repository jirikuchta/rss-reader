FROM python:3.8-slim-buster

COPY ./rss_reader /rss_reader

RUN pip install -r rss_reader/requirements.txt

EXPOSE 5000

ENTRYPOINT ["python", "-m", "rss_reader"]
