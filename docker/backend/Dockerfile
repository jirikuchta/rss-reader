FROM python:3.7

COPY ./backend /rss-reader

WORKDIR /rss-reader

RUN pip install -r requirements.txt

EXPOSE 5000

ENTRYPOINT ["python"]

CMD ["app.py"]
