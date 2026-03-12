#!/bin/sh
set -e

php -r '
$host = getenv("DB_HOST") ?: "db";
$port = getenv("DB_PORT") ?: "3306";
$db = getenv("DB_DATABASE") ?: "tft_data";
$user = getenv("DB_USERNAME") ?: "root";
$pass = getenv("DB_PASSWORD") ?: "";

for ($attempt = 1; $attempt <= 60; $attempt++) {
    try {
        $dsn = "mysql:host={$host};port={$port};dbname={$db}";
        new PDO($dsn, $user, $pass);
        fwrite(STDOUT, "Database is ready.\n");
        exit(0);
    } catch (Throwable $e) {
        fwrite(STDOUT, "Waiting for database ({$attempt}/60)...\n");
        sleep(2);
    }
}

fwrite(STDERR, "Database did not become ready in time.\n");
exit(1);
';

php artisan migrate --force
php artisan serve --host=0.0.0.0 --port=8000
