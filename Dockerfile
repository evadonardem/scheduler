FROM php:8.3.2-apache

RUN apt-get update && \
    apt-get install -y zip && \
    apt-get install -y mariadb-client && \
    apt-get install -y curl && \
    apt-get install -y git && \
    apt-get install -y bash && \
    apt-get install -y build-essential && \
    apt-get install -y libssl-dev && \
    apt-get autoclean

RUN docker-php-ext-install bcmath

RUN docker-php-ext-install ctype

RUN docker-php-ext-install pdo

RUN docker-php-ext-install pdo_mysql

RUN docker-php-ext-install sockets

RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"

RUN php -r "if (hash_file('sha384', 'composer-setup.php') === 'dac665fdc30fdd8ec78b38b9800061b4150413ff2e3b6f88543c636f7cd84f6db9189d43a81e5503cda447da73c7e5b6') { echo 'Installer verified'; } else { echo 'Installer corrupt'; unlink('composer-setup.php'); } echo PHP_EOL;"

RUN php composer-setup.php

RUN php -r "unlink('composer-setup.php');"

RUN mv composer.phar /usr/local/bin/composer

RUN a2enmod rewrite

ENV NVM_DIR="/usr/local/nvm"

ENV NVM_VERSION="v0.40.3"

RUN mkdir -p $NVM_DIR && \
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh | bash

SHELL ["/bin/bash", "-c"]

RUN . "$NVM_DIR/nvm.sh" && nvm install node && nvm use node && npm install -g npm-check-updates

WORKDIR /var/www/html

RUN git config --global --add safe.directory /var/www/html | bash
