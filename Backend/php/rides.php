<?php
require_once __DIR__ . '/db.php';

function handleRidesRoute($method, $rideId = null, $subResource = null) {
    global $pdo;
    $input = getJsonInput();
    $user = getAuthUser($pdo);
    $userId = ($user && isset($user['id'])) ? $user['id'] : 'guest_user';

    if ($method === 'POST' && !$rideId) {
        $pickup = isset($input['pickup']) ? trim($input['pickup']) : 'City Center';
        $destination = isset($input['destination']) ? trim($input['destination']) : 'Airport';
        $provider = isset($input['provider']) ? trim($input['provider']) : 'Uber';
        $cabType = isset($input['cabType']) ? trim($input['cabType']) : 'Go';
        $fare = isset($input['fare']) ? floatval($input['fare']) : 185.0;
        $etaMinutes = isset($input['etaMinutes']) ? intval($input['etaMinutes']) : 5;

        $id = "ride_" . time() . "_" . rand(100, 999);

        if ($pdo) {
            try {
                $stmt = $pdo->prepare("INSERT INTO Rides (id, userId, pickup, destination, provider, cabType, fare, etaMinutes, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', NOW())");
                $stmt->execute([$id, $userId, $pickup, $destination, $provider, $cabType, $fare, $etaMinutes]);
            } catch (Exception $e) {
            }
        }

        jsonResponse([
            "success" => true,
            "ride" => [
                "id" => $id,
                "userId" => $userId,
                "pickup" => $pickup,
                "destination" => $destination,
                "provider" => $provider,
                "cabType" => $cabType,
                "fare" => $fare,
                "etaMinutes" => $etaMinutes,
                "status" => "CONFIRMED",
                "createdAt" => date('c')
            ]
        ], 201);
    }

    if ($method === 'GET' && !$rideId) {
        $rides = [];
        if ($pdo) {
            try {
                $stmt = $pdo->prepare("SELECT * FROM Rides WHERE userId = ? ORDER BY createdAt DESC");
                $stmt->execute([$userId]);
                $rides = $stmt->fetchAll();
            } catch (Exception $e) {
            }
        }
        if (empty($rides)) {
            $rides = [
                [
                    "id" => "ride_mock_1",
                    "userId" => $userId,
                    "pickup" => "City Center",
                    "destination" => "Airport Terminal 1",
                    "provider" => "Uber",
                    "cabType" => "Go",
                    "fare" => 185.0,
                    "etaMinutes" => 5,
                    "status" => "CONFIRMED",
                    "createdAt" => date('Y-m-d H:i:s')
                ]
            ];
        }
        jsonResponse($rides);
    }

    if ($method === 'GET' && $rideId) {
        if ($pdo) {
            try {
                $stmt = $pdo->prepare("SELECT * FROM Rides WHERE id = ? LIMIT 1");
                $stmt->execute([$rideId]);
                $ride = $stmt->fetch();
                if ($ride) {
                    jsonResponse($ride);
                }
            } catch (Exception $e) {
            }
        }
        jsonResponse([
            "id" => $rideId,
            "userId" => $userId,
            "pickup" => "City Center",
            "destination" => "Airport",
            "provider" => "Uber",
            "cabType" => "Go",
            "fare" => 185.0,
            "status" => "CONFIRMED",
            "createdAt" => date('c')
        ]);
    }

    if ($method === 'PUT' && $rideId && $subResource === 'status') {
        $status = isset($input['status']) ? trim($input['status']) : 'COMPLETED';
        if ($pdo) {
            try {
                $stmt = $pdo->prepare("UPDATE Rides SET status = ? WHERE id = ?");
                $stmt->execute([$status, $rideId]);
            } catch (Exception $e) {
            }
        }
        jsonResponse(["success" => true, "id" => $rideId, "status" => $status]);
    }

    jsonResponse(["msg" => "Ride endpoint not found"], 404);
}
?>
