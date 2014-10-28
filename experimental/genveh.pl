#!/usr/bin/perl
#

use strict;

print "#!/bin/bash\n\n";

while (<>) {
  chomp;
  my $l = $_;

  print "wget 'http://realtime.mbta.com/developer/api/v2/vehiclesbyroute?api_key=wX9NwuHnZU2ToO7GmGR9uw&route=$l&format=json' -o data/$l.json\n"

}
