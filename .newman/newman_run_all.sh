#!/bin/sh

for filename in __new_tests__/postman/*.json; do
  npx newman run ${filename} --environment "__new_tests__/postman/environments/${1}.json"
  if [ $? -ne 0 ]; then
    exit 1
  fi
done

exit 0
