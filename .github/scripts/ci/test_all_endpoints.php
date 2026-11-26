<?php
/**
 * Live End-to-End Backend PHP & MySQL API Integration Test Suite
 * Tests health, auth seeding & JWT flow, profile, rides, parcels, commute,
 * geocoding proxy, and all AI engine REST endpoints on http://localhost:5000.
 */

$baseUrl = getenv('SMARTRIDE_API_URL') ?: 'http://127.0.0.1:5000';
$allowDbFallback = getenv('ALLOW_DB_FALLBACK') === '1';
$jsonOut = getenv('JSON_OUT') ?: '';

$passed = 0;
$failed = 0;
$records = [];

function httpRequest($method, $url, $body = null, $token = null) {
    $headers = ["Content-Type: application/json", "Accept: application/json"];
    if ($token) {
        $headers[] = "Authorization: Bearer " . $token;
    }
    $opts = [
        'http' => [
            'method' => $method,
            'header' => implode("\r\n", $headers) . "\r\n",
            'ignore_errors' => true,
            'timeout' => 15,
        ]
    ];
    if ($body !== null) {
        $opts['http']['content'] = json_encode($body);
    }
    $ctx = stream_context_create($opts);
    $raw = @file_get_contents($url, false, $ctx);
    $status = 0;
    if (!empty($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) {
        $status = (int)$m[1];
    }
    return ['status' => $status, 'raw' => $raw, 'json' => $raw !== false ? json_decode($raw, true) : null];
}

function assertCheck($name, $condition, $details = '') {
    global $passed, $failed, $records;
    $status = $condition ? 'PASS' : 'FAIL';
    $records[] = [
        'suite' => 'Backend PHP & MySQL API',
        'name' => $name,
        'status' => $status,
        'details' => $details,
    ];
    if ($condition) {
        $passed++;
        echo "[PASS] {$name}" . ($details ? " ({$details})" : "") . "\n";
    } else {
        $failed++;
        echo "[FAIL] {$name}" . ($details ? " ({$details})" : "") . "\n";
    }
}

echo "=== SmartRide AI Backend REST Endpoint Verification ({$baseUrl}) ===\n\n";

// 1. Health & Database Connectivity
$health = httpRequest('GET', "{$baseUrl}/");
$dbStatus = $health['json']['database'] ?? 'none';
$dbOk = $allowDbFallback
    ? in_array($dbStatus, ['connected', 'disconnected (fallback active)'], true)
    : ($dbStatus === 'connected');
assertCheck('GET / health & MySQL connected', $health['status'] === 200 && ($health['json']['status'] ?? '') === 'online' && $dbOk, "HTTP {$health['status']} db={$dbStatus}");

// 2. Demo Login (seeds demo rider in smartride_db.Users if missing)
$login = httpRequest('POST', "{$baseUrl}/api/auth/login", [
    'email' => 'rider@smartride.ai',
    'password' => 'password123'
]);
$token = $login['json']['token'] ?? null;
assertCheck('POST /api/auth/login returns JWT', $login['status'] === 200 && !empty($token), "HTTP {$login['status']}");

// 3. Authenticated /api/auth/me (requires live MySQL PDO session unless ALLOW_DB_FALLBACK=1)
$me = httpRequest('GET', "{$baseUrl}/api/auth/me", null, $token);
$meOk = ($me['status'] === 200 && (($me['json']['email'] ?? ($me['json']['user']['email'] ?? '')) === 'rider@smartride.ai'))
    || ($allowDbFallback && $dbStatus !== 'connected' && $me['status'] === 401);
assertCheck('GET /api/auth/me with JWT', $meOk, "HTTP {$me['status']}");

// 4. User Profile
$profile = httpRequest('GET', "{$baseUrl}/api/users/profile", null, $token);
$profileOk = ($profile['status'] === 200 && is_array($profile['json']))
    || ($allowDbFallback && $dbStatus !== 'connected' && $profile['status'] === 401);
assertCheck('GET /api/users/profile', $profileOk, "HTTP {$profile['status']}");

// 5. Rides & Parcels & Commute
$rides = httpRequest('GET', "{$baseUrl}/api/rides", null, $token);
assertCheck('GET /api/rides', $rides['status'] === 200 && is_array($rides['json']), "HTTP {$rides['status']}");

$parcels = httpRequest('GET', "{$baseUrl}/api/parcels", null, $token);
assertCheck('GET /api/parcels', $parcels['status'] === 200 && is_array($parcels['json']), "HTTP {$parcels['status']}");

$commute = httpRequest('GET', "{$baseUrl}/api/commute/requests", null, $token);
assertCheck('GET /api/commute/requests', $commute['status'] === 200 && is_array($commute['json']), "HTTP {$commute['status']}");

// 6. Reverse & Forward Geocoding Proxy
$revGeo = httpRequest('GET', "{$baseUrl}/api/geocode/reverse?lat=13.0827&lng=80.2707");
assertCheck('GET /api/geocode/reverse', $revGeo['status'] === 200 && !empty($revGeo['json']['address']), "address=" . ($revGeo['json']['address'] ?? ''));

$fwdGeo = httpRequest('GET', "{$baseUrl}/api/geocode/search?q=Marina+Beach+Chennai");
assertCheck('GET /api/geocode/search', $fwdGeo['status'] === 200 && isset($fwdGeo['json']['lat'], $fwdGeo['json']['lng']), "HTTP {$fwdGeo['status']}");

// 7. AI Endpoints
$decide = httpRequest('POST', "{$baseUrl}/api/ai/decide", ['pickup' => 'Guindy', 'dropoff' => 'Marina Beach']);
assertCheck('POST /api/ai/decide', $decide['status'] === 200 && !empty($decide['json']['recommendedOption']), "HTTP {$decide['status']}");

$explain = httpRequest('POST', "{$baseUrl}/api/ai/explain", ['pickup' => 'Guindy', 'dropoff' => 'Marina Beach']);
assertCheck('POST /api/ai/explain', $explain['status'] === 200 && isset($explain['json']['compositeScore']), "HTTP {$explain['status']}");

$chat = httpRequest('POST', "{$baseUrl}/api/ai/chat", ['query' => 'Which cab is cheapest?', 'message' => 'Which cab is cheapest?']);
assertCheck('POST /api/ai/chat', $chat['status'] === 200 && !empty($chat['json']['text']), "HTTP {$chat['status']}");

$mm = httpRequest('POST', "{$baseUrl}/api/ai/multimodal", ['pickup' => 'KG Apartments', 'destination' => 'Marina Beach', 'distanceKm' => 34]);
assertCheck('POST /api/ai/multimodal', $mm['status'] === 200 && !empty($mm['json']['multimodalRoutes']), "HTTP {$mm['status']}");

$cmp = httpRequest('POST', "{$baseUrl}/api/ai/compare-all", ['pickup' => 'Guindy', 'destination' => 'Marina Beach', 'distanceKm' => 11.4]);
assertCheck('POST /api/ai/compare-all', $cmp['status'] === 200 && !empty($cmp['json']['categories']), "HTTP {$cmp['status']}");

$fp = httpRequest('POST', "{$baseUrl}/api/ai/future-pricing", ['currentFare' => 699, 'distanceKm' => 34]);
assertCheck('POST /api/ai/future-pricing', $fp['status'] === 200 && isset($fp['json']['projectedFareIn15']), "HTTP {$fp['status']}");

$rt = httpRequest('POST', "{$baseUrl}/api/ai/realtime-analyze", ['pickup' => 'Guindy, Chennai', 'destination' => 'Marina Beach, Chennai']);
assertCheck('POST /api/ai/realtime-analyze', $rt['status'] === 200 && isset($rt['json']['success']) && $rt['json']['success'] === true, "HTTP {$rt['status']}");

echo "\nSummary: {$passed} passed, {$failed} failed.\n";

if ($jsonOut !== '') {
    @mkdir(dirname($jsonOut), 0777, true);
    file_put_contents($jsonOut, json_encode([
        'suite' => 'Backend PHP & MySQL API',
        'summary' => ['total' => $passed + $failed, 'passed' => $passed, 'failed' => $failed],
        'results' => $records,
    ], JSON_PRETTY_PRINT));
}

exit($failed > 0 ? 1 : 0);
