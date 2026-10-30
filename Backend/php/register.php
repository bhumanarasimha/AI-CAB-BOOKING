<?php
// SmartRide AI - Safe Registration Script
require_once __DIR__ . '/db.php';

$data = json_decode(file_get_contents("php://input"), true) ?: $_POST;

// 1. Inputs clean & normalize
$rawEmail = isset($data['email']) ? trim($data['email']) : '';
$rawPassword = isset($data['password']) ? trim($data['password']) : '';
$name = isset($data['name']) ? htmlspecialchars(trim($data['name']), ENT_QUOTES, 'UTF-8') : '';
$phone = isset($data['phone']) ? htmlspecialchars(trim($data['phone']), ENT_QUOTES, 'UTF-8') : '';

// 2. Validate email address format
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

// 3. Validate required fields
if (empty($name) || empty($rawPassword)) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "success" => false,
        "msg" => "Valid Name, Email, and Password are required.",
        "message" => "Valid Name, Email, and Password are required."
    ]);
    exit();
}

if (strlen($rawPassword) < 6) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "success" => false,
        "msg" => "Password must be at least 6 characters long.",
        "message" => "Password must be at least 6 characters long."
    ]);
    exit();
}

try {
    if ($pdo) {
        // 4. Case-insensitive duplicate check before insertion
        $stmt = $pdo->prepare("SELECT id FROM Users WHERE LOWER(email) = LOWER(:email) LIMIT 1");
        $stmt->execute(['email' => $email]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode([
                "status" => "error",
                "success" => false,
                "msg" => "Email is already registered",
                "message" => "Email is already registered"
            ]);
            exit();
        }

        // 5. Password Hashing with BCRYPT
        $hashed_password = password_hash($rawPassword, PASSWORD_BCRYPT);
        $userId = "user_" . time() . "_" . rand(100, 999);

        // 6. Secure Insert via PDO Prepared Statement
        $insertStmt = $pdo->prepare("INSERT INTO Users (id, name, email, password, phone, gender, dob, role, provider, createdAt, updatedAt) VALUES (:id, :name, :email, :password, :phone, 'Male', '1998-05-24', 'rider', 'email', NOW(), NOW())");
        $insertStmt->execute([
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'password' => $hashed_password,
            'phone' => $phone
        ]);

        $token = $userId;
        http_response_code(201);
        echo json_encode([
            "status" => "success",
            "success" => true,
            "message" => "Registration successful",
            "token" => $token,
            "id" => $userId,
            "name" => $name,
            "email" => $email,
            "phone" => $phone,
            "role" => "rider",
            "user" => [
                "id" => $userId,
                "email" => $email,
                "name" => $name,
                "phone" => $phone,
                "gender" => "Male",
                "dob" => "1998-05-24",
                "role" => "rider"
            ]
        ]);
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
    // 7. Handle concurrent duplicate entry (MySQL error 1062 / SQLSTATE 23000)
    if ($e->getCode() == 23000 || (isset($e->errorInfo[1]) && $e->errorInfo[1] == 1062)) {
        http_response_code(409);
        echo json_encode([
            "status" => "error",
            "success" => false,
            "msg" => "Email is already registered",
            "message" => "Email is already registered"
        ]);
        exit();
    }
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "success" => false,
        "msg" => "Registration could not be completed. Please try again later.",
        "message" => "Registration could not be completed. Please try again later."
    ]);
}
?>