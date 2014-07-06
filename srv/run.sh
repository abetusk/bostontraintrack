#!/bin/bash


/usr/bin/node srv.js >> log/srv.log 2>> log/srv.err &
echo $! >> log/srv.pid


