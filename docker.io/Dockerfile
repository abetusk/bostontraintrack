FROM ubuntu:14.10

RUN apt-get update && apt-get install -y apache2 nodejs git && \
  useradd -m meow && echo 'meow:mewmew' | chpasswd && \
  su meow -c " cd /home/meow && git clone https://github.com/abetusk/bostontraintrack" && \
  cp -R /home/meow/bostontraintrack/www/* /var/www/html

COPY ./startup_and_persist.sh /root/startup_and_persist.sh

EXPOSE 80

CMD [ "/root/startup_and_persist.sh" ]



