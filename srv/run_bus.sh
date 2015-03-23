#!/bin/bash

bd='/home/meow/bostontraintrack/srv'

/usr/bin/node $bd/srv_bus_v2.js >> $bd/log/srv_bus.log 2>> $bd/log/srv_bus.err &
echo $! >> $bd/log/srv_bus.pid


