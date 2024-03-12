#!/bin/bash

for VARIABLE in bcmath curl ctype dom fileinfo filter gd hash iconv intl json libxml mbstring openssl pcre pdo_mysql simplexml soap sockets sodium spl tokenizer xmlwriter xsl zip zlib lib-libxml
do
    if [ ! $(php -m | grep -w $VARIABLE) ]; then
        echo -e "\033[0;31m Não encontrado " $VARIABLE "... \033[0;32m Instaling..."
        sudo docker-php-ext-install $VARIABLE
    fi
done