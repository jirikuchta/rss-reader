RSS Reader (work-in-progress)

DEV
```
docker-compose up
```

PROD
```
docker volume create db
docker run -d --name rss-reader -p 5000:80 --mount source=db,target=/db jirikuchta/rss-reader
```
