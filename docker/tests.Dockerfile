FROM python:3.7-alpine

COPY ./app /app
COPY ./tests /tests

RUN pip install -r app/requirements.txt
RUN pip install pytest requests

CMD ["pytest", "-v", "tests"]
