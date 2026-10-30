<?php
// SmartRide AI - Safe Login Script
require_once __DIR__ . '/db.php';

$data = json_decode(file_get_contents("php://input"), true) ?: $_POST;

// 1. Inputs clean & normalize
$rawEmail = isset($data['email']) ? trim($data['email']) : '';
$rawPassword = isset($data['password']) ? trim($data['password']) : '';

if (empty($rawEmail) || !filter_var($rawEmail, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "success" => false,
        "msg" => "Please enter a valid email address",
        "message" => "Please enter a valid email address"
    ]);
    exit();
}

$email = strtolower($rawEmail);

if (empty($rawPassword)) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "success" => false,
        "msg" => "Valid email address and password are required.",
        "message" => "Valid email address and password are required."
    ]);
    exit();
}

try {
    if ($pdo) {
        // 2. Fetch User Record via case-insensitive email match
        $stmt = $pdo->prepare("SELECT id, name, email, password, phone, gender, dob, role FROM Users WHERE LOWER(email) = LOWER(:email) LIMIT 1");
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // 3. User verification with password_verify()
        if ($user && !empty($user['password']) && password_verify($rawPassword, $user['password'])) {
            $token = $user['id'];
            echo json_encode([
                "status" => "success",
                "success" => true,
                "message" => "Login successful",
                "token" => $token,
                "id" => $user['id'],
                "name" => $user['name'],
                "email" => $user['email'],
                "phone" => $user['phone'] ?: '',
                "gender" => isset($user['gender']) ? $user['gender'] : 'Male',
                "dob" => isset($user['dob']) ? $user['dob'] : '1998-05-24',
                "role" => $user['role'] ?: 'rider',
                "user" => [
                    "id" => $user['id'],
                    "email" => $user['email'],
                    "name" => $user['name'],
                    "phone" => $user['phone'] ?: '',
                    "gender" => isset($user['gender']) ? $user['gender'] : 'Male',
                    "dob" => isset($user['dob']) ? $user['dob'] : '1998-05-24',
                    "role" => $user['role'] ?: 'rider'
                ]
            ]);
        } else if ($user) {
            http_response_code(401);
            echo json_encode([
                "status" => "error",
                "success" => false,
                "msg" => "Incorrect password. Please check your credentials.",
                "message" => "Incorrect password. Please check your credentials."
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                "status" => "error",
                "success" => false,
                "msg" => "Email address not registered. Please sign up.",
                "message" => "Email address not registered. Please sign up."
            ]);
        }
    } else {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "success" => false,
            "msg" => "Database connection unavailable.",
            "message" => "Database connection unavailable."
        ]);
    }
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "success" => false,
        "msg" => "Login service error. Please try again later.",
        "message" => "Login service error. Please try again later."
    ]);
}
?>