#!/usr/bin/perl
#

use strict;

my $verbose = 0;
my $bd = "/home/meow/bostontraintrack/srv";
my $LOGFILE = "$bd/log/srv_metro.log";
my $RUNSCRIPT = "$bd/run_metro.sh";

# 30 second threshold
#
my $S_THRESHOLD = 30;

my $heartbeat= `tail -n 1000 $LOGFILE | egrep '^[0-9][0-9]* connected clients: [0-9][0-9]*' | tail -n1 `;
chomp($heartbeat);

my @a = split(/ +/, $heartbeat);
my $ms = int($a[0]);
my $sec = int($ms/1000.0);

my $now_sec = time();

my $dt = int($now_sec - $sec);

print "now: $now_sec, last: $sec, dt: $dt\n" if $verbose;


if ($dt >= $S_THRESHOLD) {
  print "server crashed?  heartbeat ${dt}s ago (> $S_THRESHOLD) moving logfile to ${LOGFILE}.$now_sec and restarting\n";
  `mv $LOGFILE ${LOGFILE}.$now_sec`;
  #`./run.sh`;
  `$RUNSCRIPT`;
} else {
  print "ok, last heartbeat ${dt}s ago\n";
}


