#!/bin/bash

bd='/home/meow/bostontraintrack/srv'

/usr/bin/node $bd/srv_v2.js >> $bd/log/srv_metro.log 2>> $bd/log/srv_metro.err &
echo $! >> $bd/log/srv_metro.pid


