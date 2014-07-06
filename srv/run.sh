#!/bin/bash

bd='/home/meow/bostontraintrack/srv'

/usr/bin/node $bd/srv.js >> $bd/log/srv.log 2>> $bd/log/srv.err &
echo $! >> $bd/log/srv.pid


