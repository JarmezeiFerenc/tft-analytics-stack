FROM php:8.3-cli-alpine

RUN apk add --no-cache \
    bash \
    git \
    icu-dev \
    libxml2-dev \
    oniguruma-dev \
    unzip \
    && docker-php-ext-install pdo pdo_mysql mbstring intl

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY . .

RUN composer install --no-interaction --prefer-dist --optimize-autoloader \
    && chmod +x docker/start.sh \
    && chmod -R ug+rw storage bootstrap/cache

EXPOSE 8000

CMD ["sh", "docker/start.sh"]
