ARG PHP_VERSION

FROM php:$PHP_VERSION

RUN apt-get update && apt-get install -y \
    unzip wget

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer && composer self-update --1

# Install PDO
RUN docker-php-ext-install pdo pdo_mysql

RUN apt-get update && apt-get install -y \
        libfreetype6-dev \
        libjpeg62-turbo-dev \
        libmcrypt-dev \
        libpng-dev \
        vim \
    && docker-php-ext-install -j$(nproc) iconv bcmath \
    && docker-php-ext-configure gd \
    && docker-php-ext-install -j$(nproc) gd

RUN apt-get install -y zlib1g-dev libicu-dev g++ libzip-dev && \
    docker-php-ext-configure intl && \
    docker-php-ext-install intl zip sockets && \
    apt-get purge -y g++

RUN apt-get install -y libxslt-dev
RUN apt-get install -y git
RUN apt-get install -y sudo
RUN docker-php-ext-install xsl soap mysqli



# Install Redis extension
RUN pecl install -o -f redis \
    && rm -rf /tmp/pear \
    && echo "extension=redis.so" > /usr/local/etc/php/conf.d/docker-php-ext-redis.ini

# Change memory limit
RUN echo 'memory_limit = 4G ' >> /usr/local/etc/php/php.ini


#Install mailhog
RUN wget https://github.com/mailhog/mhsendmail/releases/download/v0.2.0/mhsendmail_linux_amd64
RUN chmod +x mhsendmail_linux_amd64
RUN mv mhsendmail_linux_amd64 /usr/local/bin/mhsendmail
RUN echo "sendmail_path = \"/usr/local/bin/mhsendmail --smtp-addr='mailhog:1025'\"" >> /usr/local/etc/php/conf.d/docker-php-ext-mailhog.ini

# Frontend tools
RUN apt-get update
RUN apt-get install -y curl gpgv
RUN apt-get install -y nodejs
RUN apt-get install -y npm
RUN npm install grunt-cli -g

#RUN mv /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini.off
# Install xdebug
RUN pecl install xdebug-3.1.6 \
    && docker-php-ext-enable xdebug \
    && echo "xdebug.client_host=host.docker.internal" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini \
    && echo "xdebug.start_with_request=yes" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini \
    && echo "xdebug.mode=debug" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini \
    && echo "xdebug.force_display_errors=1" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini

# Add aliases for xdebug control
COPY xon /usr/bin/xon
COPY xoff /usr/bin/xoff
RUN chmod +x /usr/bin/xon
RUN chmod +x /usr/bin/xoff

# Add user and group
RUN groupadd -g 1000 app && \
    useradd -g 1000 -u 1000 -d /var/www -s /bin/bash app

RUN chown -R www-data /var/www

ENV PHP_EXTRA_CONFIGURE_ARGS --enable-fpm --with-fpm-user=app --with-fpm-group=app
RUN echo "app ALL=(root) NOPASSWD:ALL" > /etc/sudoers.d/app && \
    chmod 0440 /etc/sudoers.d/app

USER app
WORKDIR /var/www/html
