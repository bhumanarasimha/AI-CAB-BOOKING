<?php
require_once __DIR__ . '/db.php';

function handleParcelsRoute($method) {
    global $pdo;
    $input = getJsonInput();
    $user = getAuthUser($pdo);
    $userId = ($user && isset($user['id'])) ? $user['id'] : 'guest_user';
    $userName = ($user && isset($user['name'])) ? $user['name'] : 'Rider';

    if ($method === 'POST') {
        $senderName = isset($input['senderName']) ? trim($input['senderName']) : $userName;
        $senderPhone = isset($input['senderPhone']) ? trim($input['senderPhone']) : '7995665477';
        $receiverName = isset($input['receiverName']) ? trim($input['receiverName']) : 'Receiver';
        $receiverPhone = isset($input['receiverPhone']) ? trim($input['receiverPhone']) : '9876543210';
        $itemType = isset($input['itemType']) ? trim($input['itemType']) : 'Documents';
        $weight = isset($input['weight']) ? trim($input['weight']) : '1kg';
        $pickup = isset($input['pickup']) ? trim($input['pickup']) : 'Office Hub';
        $destination = isset($input['destination']) ? trim($input['destination']) : 'Tech Park';
        $fare = isset($input['fare']) ? floatval($input['fare']) : 120.0;

        $id = "parcel_" . time() . "_" . rand(100, 999);

        if ($pdo) {
            try {
                $stmt = $pdo->prepare("INSERT INTO Parcels (id, userId, senderName, senderPhone, receiverName, receiverPhone, itemType, weight, pickup, destination, fare, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NOW())");
                $stmt->execute([$id, $userId, $senderName, $senderPhone, $receiverName, $receiverPhone, $itemType, $weight, $pickup, $destination, $fare]);
            } catch (Exception $e) {
            }
        }

        jsonResponse([
            "success" => true,
            "parcel" => [
                "id" => $id,
                "userId" => $userId,
                "senderName" => $senderName,
                "senderPhone" => $senderPhone,
                "receiverName" => $receiverName,
                "receiverPhone" => $receiverPhone,
                "itemType" => $itemType,
                "weight" => $weight,
                "pickup" => $pickup,
                "destination" => $destination,
                "fare" => $fare,
                "status" => "PENDING",
                "createdAt" => date('c')
            ]
        ], 201);
    }

    if ($method === 'GET') {
        $parcels = [];
        if ($pdo) {
            try {
                $stmt = $pdo->prepare("SELECT * FROM Parcels WHERE userId = ? ORDER BY createdAt DESC");
                $stmt->execute([$userId]);
                $parcels = $stmt->fetchAll();
            } catch (Exception $e) {
            }
        }
        jsonResponse($parcels);
    }

    jsonResponse(["msg" => "Parcel endpoint not found"], 404);
}
?>
