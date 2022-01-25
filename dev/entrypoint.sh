#!/usr/bin/env sh
# cleanup filesForUpload dir before start
# upload dir should be available from the shared volume
rm -rf /uploads/*
# populate shared volume with the files
cp -r filesForUpload/* /uploads/
# start the middleware service
yarn start
