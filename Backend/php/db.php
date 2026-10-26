<?php
// SmartRide AI - PHP Database Connection & JSON Utility Helper
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = getenv('MYSQL_HOST') ?: 'localhost';
$port = getenv('MYSQL_PORT') ?: '3306';
$db   = getenv('MYSQL_DATABASE') ?: 'smartride_db';
$user = getenv('MYSQL_USER') ?: 'root';
$pass = getenv('MYSQL_PASSWORD') ?: '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    // If DB connection fails, fallback gracefully or report error
    $pdo = null;
}

function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

function getJsonInput() {
    $raw = file_get_contents("php://input");
    return json_decode($raw, true) ?: [];
}

function getAuthUser($pdo) {
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : (isset($headers['authorization']) ? $headers['authorization'] : '');

    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = $matches[1];
        if ($pdo) {
            $stmt = $pdo->prepare("SELECT id, name, email, phone, role, photoURL, preferences, savedPlaces, emergencyContacts, commuteProfile FROM Users WHERE id = ? LIMIT 1");
            $stmt->execute([$token]);
            $user = $stmt->fetch();
            if ($user) {
                return $user;
            }
        }
    }
    return [
        'id' => 'user_guest',
        'email' => 'rider@smartride.ai',
        'name' => 'Rider',
        'role' => 'rider'
    ];
}
?>
