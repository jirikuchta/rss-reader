FROM python:3.8-slim-buster

RUN apt-get update && apt-get install -y build-essential python-dev

COPY app /app
COPY requirements.txt /requirements.txt

RUN pip install -r requirements.txt

EXPOSE 5000

CMD ["uwsgi", "app/app.ini"]
