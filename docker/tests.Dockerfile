FROM python:3.8-slim-buster

RUN apt-get update && apt-get install -y build-essential python-dev

COPY app /rss_reader
COPY tests /tests
COPY requirements.txt /requirements.txt

RUN pip install -r requirements.txt
RUN pip install pytest requests

WORKDIR rss_reader

CMD ["python", "-m", "pytest", "-v", "--color=yes", "/tests"]
