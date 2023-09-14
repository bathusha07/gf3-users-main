#!/bin/sh

npx newman run __new_tests__/postman/${2}.json --environment "__new_tests__/postman/environments/${1}.json"
