#!/bin/bash
set -x
curl -v -X PUT "http://localhost:1080/mockserver/expectation" -d '{
  "httpRequest" : {
    "method" : "P.*{2,3}"
  },
  "httpResponse" : {
    "body" : ""
  }
}'

curl -v -X PUT "http://localhost:1080/mockserver/expectation" -d '{
  "httpRequest" : {
    "method" : "G.*{2,3}"
  },
  "httpResponse" : {
    "body" : ""
  }
}'
