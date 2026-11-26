<?php
/**
 * CI MySQL Schema Initializer using PDO.
 * Loads Backend/php/schema.sql cleanly into target MYSQL_DATABASE without requiring external mysql CLI.
 */

$repoRoot = dirname(__DIR__, 3);
$schemaFile = $repoRoot . '/Backend/php/schema.sql';

$host = getenv('MYSQL_HOST') ?: '127.0.0.1';
$port = getenv('MYSQL_PORT') ?: '3306';
$db   = getenv('MYSQL_DATABASE') ?: 'smartride_db';
$user = getenv('MYSQL_USER') ?: 'root';
$pass = getenv('MYSQL_PASSWORD') ?: '';

$pdo = new PDO(
    "mysql:host={$host};port={$port};charset=utf8mb4",
    $user,
    $pass,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$sqlRaw = file_get_contents($schemaFile);
$lines = preg_split('/\r?\n/', $sqlRaw);
$cleanLines = [];
foreach ($lines as $line) {
    $trimmed = ltrim($line);
    if (strpos($trimmed, '--') === 0 || $trimmed === '') {
        continue;
    }
    $cleanLines[] = $line;
}

$statements = array_filter(array_map('trim', explode(';', implode("\n", $cleanLines))));
foreach ($statements as $stmt) {
    $pdo->exec($stmt);
}

$pdo->exec("USE `{$db}`");
echo "[PASS] Initialized MySQL schema in {$host}:{$port}/{$db} (" . count($statements) . " statements)\n";
