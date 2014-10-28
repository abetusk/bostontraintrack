#!/usr/bin/perl
#
use strict;

my $fn = ($ARGV[0] || "routes_modified.csv");

my $col = 6;
my $pos = 0;

print "  <div class='row' style='margin-bottom:50px; margin-top:50px;'>\n";


open FH, $fn;
while (<FH>) {
  my $l = $_;
  chomp($l);

  my ($type, $mode, $id, $name) = split(/,/, $l);

  my $mod = " id='$id' onclick='toggle(\"$id\");' ";

  next if $type =~ /Boat/;
  $name =~ s/\// \/ /;

  #print "$type, $mode, $id, $name\n";

  if (($pos>0) and (($pos % $col)==0)) {
    print "  </div>\n" if ($pos>0);
    print "  <div class='row' style='margin-bottom:50px; margin-top:50px;'>\n";
  }

  my $div = "";

  #print "    <div class='col-sm-2' style='text-align:center;' >\n";

  $div .= "    <div $mod class='col-sm-2' style='text-align:center;' >\n";

  #print "    <img src='${type}-$id'></img>\n";

  #my $wh = " width='32px' height='32px' ";
  #my $wh = "";
  my $wh = " style=' height:47px; width:38px; opacity:0.3; ' ";

  if ($type eq "Subway") {

    my $t = $id;
    if ($name eq "Green Line") {

#      if ($id =~ /813/) {
#        print "    <img src='img/metro_green_rB_sq.png' $wh ></img> <br>\n";
#      } elsif ($id =~ /831/) {
#        print "    <img src='img/metro_green_rC_sq.png' $wh ></img> <br>\n";
#      } elsif ($id =~ /851/) {
#        print "    <img src='img/metro_green_rD_sq.png' $wh ></img> <br>\n";
#      } elsif ($id =~ /880/) {
#        print "    <img src='img/metro_green_rE_sq.png' $wh ></img> <br>\n";
#      } else {
#        print "    <img src='img/metro_green_sq.png' $wh ></img> <br>\n";
#      }
      #print "    <img src='img/metro_green_sq.png' $wh ></img> <br>\n";
      $div .= "    <img id='img_$id' src='img/metro_green_sq.png' $wh ></img> <br>\n";

      if ($id =~ /813/) {
        $t = "B";
      } elsif ($id =~ /831/) {
        $t = "C";
      } elsif ($id =~ /851/) {
        $t = "D";
      } elsif ($id =~ /880/) {
        $t = "E";
      } else {
        next;
      }

    } elsif ($name eq "Blue Line") {
      #print "    <img src='img/metro_blue_sq.png'></img> <br>\n";
      $div .= "    <img id='img_$id' src='img/metro_blue_sq.png'></img> <br>\n";
    } elsif ($name eq "Red Line") {
      #print "    <img src='img/metro_red_sq.png'></img> <br>\n";
      $div .= "    <img id='img_$id' src='img/metro_red_sq.png'></img> <br>\n";
    } elsif ($name eq "Orange Line") {
      #print "    <img src='img/metro_orange_sq.png'></img> <br>\n";
      $div .= "    <img id='img_$id' src='img/metro_orange_sq.png'></img> <br>\n";
    } else {
      #print "    <img src='img/train_sq.png'></img> <br>\n";
      $div .= "    <img id='img_$id' src='img/train_sq.png'></img> <br>\n";
      next;
    }

    $t =~ s/_//g;

    #print "    $name ($t)\n";
    $div .= "    $name ($t)\n";
  }

  elsif ($type eq "Commuter Rail") {
    #print "    <img src='img/commuter_sq.png'></img> <br>\n";
    #print "    $name\n";
    $div .= "    <img id='img_$id' src='img/commuter_sq.png' $wh ></img> <br>\n";
    $div .= "    $name\n";
  }

  elsif ($type eq "Bus") {
    #print "    <img src='img/bus_gw_sq.png'></img> <br>\n";
    #print "    $name\n";
    $div .= "    <img id='img_$id' src='img/bus_gw_sq.png' $wh ></img> <br>\n";
    $div .= "    $name\n";
  }

  #print "    </div>\n";
  $div .= "    </div>\n";

  print $div;

  $pos ++;
}
close(FH);

print "  </div>\n";
print "\n\n";
