FROM python:3.8-slim-buster

COPY ./app /app
RUN chown nobody:nogroup /app

RUN pip install -r app/requirements.txt

EXPOSE 5000

WORKDIR /app

CMD ["flask", "run", "--host=0.0.0.0"]
