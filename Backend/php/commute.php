<?php
require_once __DIR__ . '/db.php';

/**
 * Community / Smart Commute Requests Endpoint: /api/commute/requests
 * Persists user-created commute & carpool requests in Backend/php/data/commute_requests.json
 * so they display immediately across both Web and Android interfaces.
 */
function handleCommuteRoute($method, $subAction = null) {
    $dataDir = __DIR__ . '/data';
    if (!is_dir($dataDir)) {
        @mkdir($dataDir, 0775, true);
    }
    $storageFile = $dataDir . '/commute_requests.json';

    $requests = [];
    if (file_exists($storageFile)) {
        $raw = @file_get_contents($storageFile);
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            $requests = $decoded;
        }
    }

    if ($method === 'GET') {
        jsonResponse([
            'success' => true,
            'count' => count($requests),
            'requests' => $requests
        ]);
        return;
    }

    if ($method === 'DELETE') {
        $input = getJsonInput();
        $id = isset($_GET['id']) ? trim($_GET['id']) : (isset($input['id']) ? trim($input['id']) : '');
        if ($id !== '') {
            $requests = array_values(array_filter($requests, function($r) use ($id) {
                return ($r['id'] ?? '') !== $id;
            }));
            @file_put_contents($storageFile, json_encode($requests, JSON_PRETTY_PRINT));
        }
        jsonResponse([
            'success' => true,
            'removedId' => $id,
            'requests' => $requests
        ]);
        return;
    }

    // POST: Create or update a community commute request
    $input = getJsonInput();
    $req = [
        'id' => isset($input['id']) && trim($input['id']) !== '' ? trim($input['id']) : ('commute_' . time() . '_' . rand(100, 999)),
        'type' => isset($input['type']) ? trim($input['type']) : 'posted', // 'posted' | 'pool_booking'
        'userName' => isset($input['userName']) && trim($input['userName']) !== '' ? trim($input['userName']) : 'You',
        'role' => isset($input['role']) ? trim($input['role']) : 'rider',
        'source' => isset($input['source']) && trim($input['source']) !== '' ? trim($input['source']) : 'Current Location',
        'destination' => isset($input['destination']) && trim($input['destination']) !== '' ? trim($input['destination']) : 'Tidel Park, OMR',
        'departureTime' => isset($input['departureTime']) ? trim($input['departureTime']) : '08:30',
        'returnTime' => isset($input['returnTime']) ? trim($input['returnTime']) : '18:00',
        'transport' => isset($input['transport']) ? trim($input['transport']) : 'car',
        'workMode' => isset($input['workMode']) ? trim($input['workMode']) : 'office',
        'vehicleNumber' => isset($input['vehicleNumber']) ? trim($input['vehicleNumber']) : '',
        'partnerName' => isset($input['partnerName']) ? trim($input['partnerName']) : '',
        'partnerCar' => isset($input['partnerCar']) ? trim($input['partnerCar']) : '',
        'otp' => isset($input['otp']) ? trim($input['otp']) : '',
        'seats' => isset($input['seats']) ? intval($input['seats']) : 1,
        'status' => isset($input['status']) ? trim($input['status']) : 'Active',
        'createdAt' => isset($input['createdAt']) ? trim($input['createdAt']) : date('c')
    ];

    // Prepend newest request & avoid exact duplicate IDs
    $requests = array_values(array_filter($requests, function($r) use ($req) {
        return ($r['id'] ?? '') !== $req['id'];
    }));
    array_unshift($requests, $req);

    if (count($requests) > 50) {
        $requests = array_slice($requests, 0, 50);
    }

    @file_put_contents($storageFile, json_encode($requests, JSON_PRETTY_PRINT));

    jsonResponse([
        'success' => true,
        'request' => $req,
        'requests' => $requests
    ]);
}
