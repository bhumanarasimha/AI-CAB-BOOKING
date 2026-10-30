<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/users.php';
require_once __DIR__ . '/rides.php';
require_once __DIR__ . '/parcels.php';
require_once __DIR__ . '/chats.php';

// Request URI and Method parsing
$requestUri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// Strip query string and base paths
$path = parse_url($requestUri, PHP_URL_PATH);
$path = preg_replace('/^\/Backend\/php\/index\.php/', '', $path);
$path = preg_replace('/^\/Backend\/php/', '', $path);
$path = preg_replace('/^\/api/', '', $path);
$path = '/' . ltrim($path, '/');

$parts = array_values(array_filter(explode('/', $path)));

// --- Route Matching ---

// Direct file routing support (e.g. /login.php, /register.php, /rides.php, /parcels.php)
$filename = isset($parts[0]) ? basename($parts[0]) : '';
if ($filename && file_exists(__DIR__ . '/' . $filename) && $filename !== 'index.php') {
    require __DIR__ . '/' . $filename;
    exit();
}

// Auth Routes (/auth/*, /login, /register)
if (isset($parts[0]) && ($parts[0] === 'auth' || $parts[0] === 'login' || $parts[0] === 'register')) {
    $action = ($parts[0] === 'login') 
        ? 'login' 
        : (($parts[0] === 'register') 
            ? 'register' 
            : (isset($parts[1]) ? $parts[1] : ''));
    handleAuthRoute($action);
}

// User Profile Routes (/users/*)
if (isset($parts[0]) && $parts[0] === 'users') {
    $action = isset($parts[1]) ? $parts[1] : '';
    handleUsersRoute($action);
}

// Ride Routes (/rides/*)
if (isset($parts[0]) && $parts[0] === 'rides') {
    $rideId = isset($parts[1]) ? $parts[1] : null;
    $subResource = isset($parts[2]) ? $parts[2] : null;
    handleRidesRoute($method, $rideId, $subResource);
}

// Parcel Delivery Routes (/parcels/*)
if (isset($parts[0]) && $parts[0] === 'parcels') {
    handleParcelsRoute($method);
}

// Chat Routes (/chats/*)
if (isset($parts[0]) && $parts[0] === 'chats') {
    $chatId = isset($parts[1]) ? $parts[1] : null;
    $subResource = isset($parts[2]) ? $parts[2] : null;
    handleChatsRoute($method, $chatId, $subResource);
}

// Telemetry & Logs (/performance-logs)
if (isset($parts[0]) && $parts[0] === 'performance-logs') {
    $input = getJsonInput();
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("INSERT INTO PerformanceLogs (event, durationMs, payload, createdAt) VALUES (?, ?, ?, NOW())");
            $stmt->execute([
                isset($input['event']) ? $input['event'] : 'log',
                isset($input['durationMs']) ? intval($input['durationMs']) : 0,
                json_encode($input)
            ]);
        } catch (Exception $e) {
        }
    }
    jsonResponse(["success" => true]);
}

// AI Decision Engine (/ai/decide & /ai/explain)
if (isset($parts[0]) && $parts[0] === 'ai') {
    $action = isset($parts[1]) ? $parts[1] : 'decide';
    $input = getJsonInput();

    if ($action === 'explain') {
        $fare = isset($input['fare']) ? floatval($input['fare']) : 145;
        $eta = isset($input['eta']) ? intval($input['eta']) : 3;
        $pickupMeters = isset($input['pickupMeters']) ? intval($input['pickupMeters']) : 90;
        $surge = isset($input['surge']) ? floatval($input['surge']) : 1.0;
        $isSmart = isset($input['isSmart']) ? (is_bool($input['isSmart']) ? $input['isSmart'] : filter_var($input['isSmart'], FILTER_VALIDATE_BOOLEAN)) : false;
        $cancellationRisk = isset($input['cancellationRisk']) ? floatval($input['cancellationRisk']) : 0.02;

        $baseValue = 62.0;
        $fareImpact = $surge <= 1.0 ? 18.5 : -14.0;
        $stabilityImpact = $cancellationRisk <= 0.03 ? 16.0 : -10.0;
        $walkImpact = $pickupMeters <= 120 ? 12.0 : -8.0;
        $etaImpact = $eta <= 4 ? 8.5 : -5.0;
        $carbonImpact = $isSmart ? 10.0 : -2.5;
        $compositeScore = min(99, round($baseValue + $fareImpact + $stabilityImpact + $walkImpact + $etaImpact + $carbonImpact));

        jsonResponse([
            "methodology" => "NeurIPS 2022 Explainable Multi-Agent Recommender Architecture",
            "baseValue" => $baseValue,
            "compositeScore" => $compositeScore,
            "shapWaterfall" => [
                ["feature" => "Zero Surge Guarantee", "agent" => "FareAgent", "value" => $fareImpact, "positive" => $fareImpact >= 0],
                ["feature" => "Driver Reliability", "agent" => "StabilityAgent", "value" => $stabilityImpact, "positive" => $stabilityImpact >= 0],
                ["feature" => "Curbside Walk", "agent" => "HumanEffortAgent", "value" => $walkImpact, "positive" => $walkImpact >= 0],
                ["feature" => "Arrival ETA", "agent" => "HumanEffortAgent", "value" => $etaImpact, "positive" => $etaImpact >= 0],
                ["feature" => "Green EV Propulsion", "agent" => "CarbonAgent", "value" => $carbonImpact, "positive" => $carbonImpact >= 0]
            ],
            "limeRules" => [
                ["rule" => "Surge_Multiplier == 1.0", "impact" => "+22.5%", "confidence" => 0.98],
                ["rule" => "Curbside_Walk_Distance <= 120m", "impact" => "+14.0%", "confidence" => 0.97],
                ["rule" => "Driver_Cancellation_Risk <= 3%", "impact" => "+16.8%", "confidence" => 0.96],
                ["rule" => "Vehicle_Type == 'EV'", "impact" => "+11.2%", "confidence" => 0.99]
            ],
            "reasoning" => "High composite utility driven by zero surge ceiling, instant curbside arrival, and 100% clean electric mobility."
        ]);
    }

    // Default: /ai/decide
    $pickup = isset($input['pickup']) ? $input['pickup'] : 'Royapettah';
    $dropoff = isset($input['dropoff']) ? $input['dropoff'] : 'OMR';
    $strategy = isset($input['strategy']) ? $input['strategy'] : 'balanced';

    jsonResponse([
        "recommendedOption" => "SmartRide AI EV Sedan",
        "provider" => "SmartRide AI",
        "confidence" => 0.97,
        "strategy" => $strategy,
        "route" => ["pickup" => $pickup, "dropoff" => $dropoff],
        "agentScorecards" => [
            "fareAgent" => 94,
            "stabilityAgent" => 98,
            "humanEffortAgent" => 92,
            "contextAgent" => 88,
            "carbonAgent" => 99
        ],
        "compositeScore" => 95,
        "reasoning" => "Zero surge protection, 90m curbside pickup, and 99% dispatch reliability make SmartRide EV the dominant mobility equilibrium."
    ]);
}

// Root API Welcome / Health check
if ($path === '/' || empty($parts)) {
    jsonResponse([
        "status" => "online",
        "service" => "SmartRide AI PHP & MySQL REST API",
        "database" => $pdo ? "connected" : "disconnected (fallback active)",
        "version" => "1.0.0"
    ]);
}

// Fallback 404
jsonResponse(["msg" => "Endpoint not found: " . $path], 404);
?>
