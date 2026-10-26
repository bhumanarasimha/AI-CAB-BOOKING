<?php
require_once __DIR__ . '/db.php';

function handleUsersRoute($action) {
    global $pdo;
    $input = getJsonInput();
    $user = getAuthUser($pdo);

    if ($action === 'profile') {
        $name = isset($input['name']) ? trim($input['name']) : $user['name'];
        $phone = isset($input['phone']) ? trim($input['phone']) : (isset($user['phone']) ? $user['phone'] : '');

        if ($pdo && isset($user['id'])) {
            try {
                $stmt = $pdo->prepare("UPDATE Users SET name = ?, phone = ?, updatedAt = NOW() WHERE id = ?");
                $stmt->execute([$name, $phone, $user['id']]);
            } catch (Exception $e) {
            }
        }
        jsonResponse([
            "success" => true,
            "user" => array_merge($user, ["name" => $name, "phone" => $phone])
        ]);
    }

    if ($action === 'preferences') {
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
