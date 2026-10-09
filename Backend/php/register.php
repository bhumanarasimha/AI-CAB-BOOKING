<?php
require_once __DIR__ . '/db.php';

$data = json_decode(file_get_contents("php://input"), true);
$email = isset($data['email']) ? strtolower(trim($data['email'])) : '';
$password = isset($data['password']) ? $data['password'] : '';
$name = isset($data['name']) ? trim($data['name']) : '';
$phone = isset($data['phone']) ? trim($data['phone']) : '';

if (empty($email) || empty($password) || empty($name)) {
    http_response_code(400);
    echo json_encode(["msg" => "Name, Email and Password are required"]);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT id FROM Users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(["msg" => "An account with this email already exists"]);
        exit();
    }

    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    $userId = "user_" . time() . "_" . rand(100, 999);

    $insertStmt = $pdo->prepare("INSERT INTO Users (id, name, email, password, phone, role, provider, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 'rider', 'email', NOW(), NOW())");
    $insertStmt->execute([$userId, $name, $email, $hashedPassword, $phone]);

    $token = "php_jwt_" . bin2hex(random_bytes(16));
    echo json_encode([
        "token" => $token,
        "user" => [
            "id" => $userId,
            "email" => $email,
            "name" => $name,
            "phone" => $phone,
            "role" => "rider"
        ]
    ]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["msg" => "Registration error", "details" => $e->getMessage()]);
}
?>
