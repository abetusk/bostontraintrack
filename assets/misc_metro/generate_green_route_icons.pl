#!/usr/bin/perl
#

use strict;

my @routes = ("B", "C", "D", "E");
my @heading = (0, 45, 90, 135, 180, 225, 270, 315, "sq");

my $lame_count = 0;

for my $heading (@heading) {
for my $route (@routes) {
  #print "$route\n";

  my $s = sprintf("%d", $route);
  my $s = length( $route );
  my $n = scalar($s);

  my $bub_width = ($n * 4) + 2 + 2;
  my $bub_height = (9);

  my $bw2 = int($bub_width/2);

  my $bub_offset = 0;
  my $left_overflow = $bw2 - 6;
  if ($left_overflow < 0) {
    $left_overflow = 0;
    $bub_offset = 6 - 2 - 2;
  }

  my $tot_width = 32 + 2*$left_overflow;
  my $tot_height = 37 + 2;

  print "#route $route\n";

  #my $base_icon = "bus_gw_" . $heading[0] . ".png";
  my $base_icon = "metro_green_" . $heading . ".png";
  my $cmd = "convert -page ${tot_width}x${tot_height}+$left_overflow+2 $base_icon ";
  $cmd .= " -page +$bub_offset+0 extra/bub_left.png ";

  my $cur_offset = $bub_offset + 2;
  my @n = split(//, $route );
  for my $x (@n) {

    $cmd .= " -page +$cur_offset+0 extra/bub_middle.png ";
    $cur_offset++;

    $cmd .= " -page +$cur_offset+0 extra/bub_middle.png ";
    $cur_offset++;

    $cmd .= " -page +$cur_offset+0 extra/bub_middle.png ";
    $cur_offset++;

    $cmd .= " -page +$cur_offset+0 extra/bub_middle.png ";
    $cur_offset++;

  }
  $cur_offset--;
  $cmd .= " -page +$cur_offset+0 extra/bub_right.png";

  my $cur_offset = $bub_offset + 2;
  for my $x (@n) {
    my $p = $cur_offset - 1;
    $cmd .= " -page +$p+2 extra/$x.png ";
    $cur_offset += 4;
  }



  $cmd .= " -background none -flatten metro_green_route_icon/metro_green_r${route}_$heading.png ";


  print "$cmd\n";
  `$cmd`;


  #exit if $lame_count>2;
  $lame_count++;
}
}
