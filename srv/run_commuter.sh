#!/bin/bash

bd='/home/meow/bostontraintrack/srv'

/usr/bin/node $bd/srv_commuter.js >> $bd/log/srv_commuter.log 2>> $bd/log/srv_commuter.err &
echo $! >> $bd/log/srv_commuter.pid


