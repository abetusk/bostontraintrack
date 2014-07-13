#!/usr/bin/python

import re,cgi,cgitb,sys
import os
import urllib
import time
import datetime
cgitb.enable()

form = cgi.FieldStorage()

email = ""
if "Email" in form:
  email = form["Email"].value

feedback = ""
if "Message" in form:
  feedback = form["Message"].value


dt = datetime.datetime.now()
dtp = dt.strftime("%a, %d-%b-%Y %H:%M:%S PST")


with open("/home/www-data/feedback.txt", "a") as myfile:
  myfile.write(dtp + "\n")
  myfile.write("=============================\n\n")
  myfile.write("From: " + str(email) + "\n--------------\n" )
  myfile.write( str(feedback) + "\n\n" )

print "Location:feedbacksent.html"
print

