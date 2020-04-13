FROM python:3.7-alpine

COPY ./rss_reader /rss_reader
COPY ./tests /tests

RUN pip install -r rss_reader/requirements.txt
RUN pip install pytest requests

CMD ["pytest", "-v", "tests"]
