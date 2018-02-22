#!/bin/bash

docker exec -it token-mongo mongoimport -h localhost:27017 --db wallet --collection contracts --drop --jsonArray --file contracts.json

