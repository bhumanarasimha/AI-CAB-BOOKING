<?php
require_once __DIR__ . '/db.php';

function handleUsersRoute($action) {
    global $pdo;
    $input = getJsonInput();
    $user = getAuthUser($pdo);
    $method = isset($_SERVER['REQUEST_METHOD']) ? strtoupper($_SERVER['REQUEST_METHOD']) : 'GET';

    // Guard: Enforce authentication for user routes, with fallback by email in input
    if (!$user && !empty($input['email']) && $pdo) {
        $fallbackStmt = $pdo->prepare("SELECT id, name, email, phone, gender, dob, role, photoURL, preferences, savedPlaces, emergencyContacts, commuteProfile FROM Users WHERE LOWER(email) = LOWER(:email) LIMIT 1");
        $fallbackStmt->execute(['email' => strtolower(trim($input['email']))]);
        $user = $fallbackStmt->fetch();
    }

    if (!$user) {
        jsonResponse(["status" => "error", "success" => false, "msg" => "Unauthorized - Invalid or expired session."], 401);
    }

    if ($action === 'profile') {
        if ($method === 'GET') {
            if (isset($user['password'])) {
                unset($user['password']);
            }
            jsonResponse([
                "status" => "success",
                "success" => true,
                "user" => $user
            ]);
        }

        // On POST / PUT / PATCH: update profile only if fields are explicitly provided
        $name = (!empty($input['name']) && trim($input['name']) !== '') 
            ? htmlspecialchars(trim($input['name']), ENT_QUOTES, 'UTF-8') 
            : (isset($user['name']) ? $user['name'] : 'Rider');
        $phone = isset($input['phone']) 
            ? htmlspecialchars(trim($input['phone']), ENT_QUOTES, 'UTF-8') 
            : (isset($user['phone']) ? $user['phone'] : '');
        $gender = (!empty($input['gender']) && trim($input['gender']) !== '')
            ? htmlspecialchars(trim($input['gender']), ENT_QUOTES, 'UTF-8')
            : (isset($user['gender']) ? $user['gender'] : 'Male');
        $dob = (!empty($input['dob']) && trim($input['dob']) !== '')
            ? htmlspecialchars(trim($input['dob']), ENT_QUOTES, 'UTF-8')
            : (isset($user['dob']) ? $user['dob'] : '1998-05-24');

        $email = isset($user['email']) ? $user['email'] : '';
        if (!empty($input['email']) && filter_var(trim($input['email']), FILTER_VALIDATE_EMAIL)) {
            $checkEmail = strtolower(trim($input['email']));
            if ($checkEmail !== strtolower($email) && $pdo) {
                $checkStmt = $pdo->prepare("SELECT id FROM Users WHERE LOWER(email) = LOWER(:email) AND id != :id LIMIT 1");
                $checkStmt->execute(['email' => $checkEmail, 'id' => $user['id']]);
                if (!$checkStmt->fetch()) {
                    $email = $checkEmail;
                }
            }
        }

        if ($pdo && isset($user['id'])) {
            try {
                $stmt = $pdo->prepare("UPDATE Users SET name = ?, email = ?, phone = ?, gender = ?, dob = ?, updatedAt = NOW() WHERE id = ?");
                $stmt->execute([$name, $email, $phone, $gender, $dob, $user['id']]);
            } catch (Exception $e) {
            }
        }

        $updatedUser = array_merge($user, [
            "name" => $name,
            "email" => $email,
            "phone" => $phone,
            "gender" => $gender,
            "dob" => $dob
        ]);
        if (isset($updatedUser['password'])) {
            unset($updatedUser['password']);
        }
        jsonResponse([
            "status" => "success",
            "success" => true,
            "user" => $updatedUser
        ]);
    }

    if ($action === 'preferences') {
        if ($method === 'GET') {
            $currentPrefs = isset($user['preferences']) ? (is_array($user['preferences']) ? $user['preferences'] : json_decode($user['preferences'], true)) : [];
            jsonResponse(["success" => true, "preferences" => $currentPrefs ?: []]);
        }
        $prefs = isset($input['preferences']) ? $input['preferences'] : [];
        if ($pdo && isset($user['id'])) {
            try {
                $stmt = $pdo->prepare("UPDATE Users SET preferences = ?, updatedAt = NOW() WHERE id = ?");
                $stmt->execute([json_encode($prefs), $user['id']]);
            } catch (Exception $e) {
            }
        }
        jsonResponse(["success" => true, "preferences" => $prefs]);
    }

    if ($action === 'saved-places') {
        if ($method === 'GET') {
            $currentPlaces = isset($user['savedPlaces']) ? (is_array($user['savedPlaces']) ? $user['savedPlaces'] : json_decode($user['savedPlaces'], true)) : [];
            jsonResponse(["success" => true, "savedPlaces" => $currentPlaces ?: []]);
        }
        $places = isset($input['savedPlaces']) ? $input['savedPlaces'] : [];
        if ($pdo && isset($user['id'])) {
            try {
                $stmt = $pdo->prepare("UPDATE Users SET savedPlaces = ?, updatedAt = NOW() WHERE id = ?");
                $stmt->execute([json_encode($places), $user['id']]);
            } catch (Exception $e) {
            }
        }
        jsonResponse(["success" => true, "savedPlaces" => $places]);
    }

    if ($action === 'emergency-contacts') {
        if ($method === 'GET') {
            $currentContacts = isset($user['emergencyContacts']) ? (is_array($user['emergencyContacts']) ? $user['emergencyContacts'] : json_decode($user['emergencyContacts'], true)) : [];
            jsonResponse(["success" => true, "emergencyContacts" => $currentContacts ?: []]);
        }
        $contacts = isset($input['emergencyContacts']) ? $input['emergencyContacts'] : [];
        if ($pdo && isset($user['id'])) {
            try {
                $stmt = $pdo->prepare("UPDATE Users SET emergencyContacts = ?, updatedAt = NOW() WHERE id = ?");
                $stmt->execute([json_encode($contacts), $user['id']]);
            } catch (Exception $e) {
            }
        }
        jsonResponse(["success" => true, "emergencyContacts" => $contacts]);
    }

    if ($action === 'commute-profile') {
        if ($method === 'GET') {
            $currentCommute = isset($user['commuteProfile']) ? (is_array($user['commuteProfile']) ? $user['commuteProfile'] : json_decode($user['commuteProfile'], true)) : [];
            jsonResponse(["success" => true, "commuteProfile" => $currentCommute ?: []]);
        }
        $commute = isset($input['commuteProfile']) ? $input['commuteProfile'] : [];
        if ($pdo && isset($user['id'])) {
            try {
                $stmt = $pdo->prepare("UPDATE Users SET commuteProfile = ?, updatedAt = NOW() WHERE id = ?");
                $stmt->execute([json_encode($commute), $user['id']]);
            } catch (Exception $e) {
            }
        }
        jsonResponse(["success" => true, "commuteProfile" => $commute]);
    }

    jsonResponse(["msg" => "User endpoint not found"], 404);
}
?>