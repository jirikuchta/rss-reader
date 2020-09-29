FROM python:3.8-slim-buster

COPY ./rss_reader /rss_reader
RUN chown nobody:nogroup /rss_reader

RUN pip install -r rss_reader/requirements.txt

EXPOSE 5000

WORKDIR /rss_reader

CMD ["flask", "run", "--host=0.0.0.0"]
