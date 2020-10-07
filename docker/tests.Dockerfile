FROM python:3.8-slim-buster

COPY ./app /app
COPY ./tests /tests

RUN pip install -r app/requirements.txt
RUN pip install pytest requests

CMD ["pytest", "-v", "tests"]
