FROM python:3.8-slim-buster

COPY app /app
COPY tests /tests
COPY requirements.txt /requirements.txt

RUN pip install -r requirements.txt
RUN pip install pytest requests

CMD ["pytest", "-v", "tests"]
