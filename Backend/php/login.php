<?php
require_once __DIR__ . '/db.php';

$data = json_decode(file_get_contents("php://input"), true);
$email = isset($data['email']) ? strtolower(trim($data['email'])) : '';
$password = isset($data['password']) ? $data['password'] : '';

if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(["msg" => "Email and password are required"]);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT * FROM Users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        $token = "php_jwt_" . bin2hex(random_bytes(16));
        echo json_encode([
            "token" => $token,
            "user" => [
                "id" => $user['id'],
                "email" => $user['email'],
                "name" => $user['name'],
                "phone" => $user['phone'],
                "role" => $user['role']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["msg" => "Invalid email or password"]);
    }
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["msg" => "Database error", "details" => $e->getMessage()]);
}
?>
