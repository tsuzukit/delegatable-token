#!/bin/bash

function set_env_to_test () {
  sed -i -e 's/MONGO_DATABASE=wallet/MONGO_DATABASE=test/g' ./app/.env
  rm ./app/.env-e 2>/dev/null
}
function set_env_to_dev () {
  sed -i -e 's/MONGO_DATABASE=test/MONGO_DATABASE=wallet/g' ./app/.env
  rm ./app/.env-e 2>/dev/null
}

CMDNAME=`basename $0`

# Move to project root
ROOT_DIR=`dirname $0`/../..
cd $ROOT_DIR

set_env_to_test
docker exec -it token-app npm test ./test/delegatable_token.test.js
set_env_to_dev
