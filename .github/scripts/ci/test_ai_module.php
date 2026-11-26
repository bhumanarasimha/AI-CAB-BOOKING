<?php
// Test runner for SmartMobility AI Module in Backend/php
$repoRoot = dirname(__DIR__, 3);
require_once $repoRoot . '/Backend/php/db.php';
require_once $repoRoot . '/Backend/php/ai.php';

echo "============================================================\n";
echo " TESTING SMARTMOBILITY AI ENGINE (PHP BACKEND ENDPOINTS)\n";
echo "============================================================\n\n";

function runTestEndpoint($handler, $payload) {
    $GLOBALS['_TEST_INPUT'] = $payload;
    ob_start();
    $handler('POST');
    $output = ob_get_clean();
    return json_decode($output, true);
}

// 1. Test Multimodal Route Engine (KG Apartments -> Marina Beach)
echo "[1] Testing Multimodal Route Engine (KG Apartments -> Marina Beach, 34km):\n";
$_SERVER['REQUEST_METHOD'] = 'POST';
$mmResult = runTestEndpoint('handleMultimodalRoute', [
    'pickup' => 'KG Apartments',
    'destination' => 'Marina Beach',
    'distanceKm' => 34.0
]);

if (empty($mmResult['multimodalRoutes'])) {
    fwrite(STDERR, "FAILED: Missing multimodalRoutes\n");
    exit(1);
}

echo "  * Direct Cab Benchmark: Rs " . $mmResult['directCabBaseline']['rapido'] . " (Rapido) / Rs " . $mmResult['directCabBaseline']['ola'] . " (Ola) / Rs " . $mmResult['directCabBaseline']['uber'] . " (Uber)\n";
foreach ($mmResult['multimodalRoutes'] as $r) {
    echo "  * " . $r['title'] . ": Total Rs " . $r['totalFare'] . " (" . $r['badge'] . ")\n";
    foreach ($r['legs'] as $leg) {
        echo "      - " . $leg['label'] . " (" . $leg['duration'] . ") -> Rs " . $leg['fare'] . "\n";
    }
}

// 2. Test Cross-App Price Comparison (Goal 2)
echo "\n[2] Testing Cross-App Price Comparison (KG Apartments -> Marina Beach):\n";
$cmpResult = runTestEndpoint('handleCompareAllRoute', [
    'pickup' => 'KG Apartments',
    'destination' => 'Marina Beach',
    'distanceKm' => 34.0
]);
if (empty($cmpResult['categories']['cab_economy']['options'])) {
    fwrite(STDERR, "FAILED: Missing cab_economy options\n");
    exit(1);
}
echo "  * Cab Economy Comparison:\n";
foreach ($cmpResult['categories']['cab_economy']['options'] as $opt) {
    $cheapestBadge = !empty($opt['isCheapest']) ? " [CHEAPEST]" : "";
    echo "      - " . $opt['provider'] . " (" . $opt['vehicleType'] . "): Rs " . $opt['fare'] . $cheapestBadge . " (ETA: " . $opt['etaMinutes'] . "m)\n";
}

// 3. Test Future Pricing Predictor (Goal 3)
echo "\n[3] Testing Future Pricing & Surge Drop Predictor (Goal 3):\n";
$fpResult = runTestEndpoint('handleFuturePricingRoute', [
    'currentFare' => 699,
    'distanceKm' => 34.0
]);
if (!isset($fpResult['projectedFareIn15'])) {
    fwrite(STDERR, "FAILED: Missing projectedFareIn15\n");
    exit(1);
}
echo "  * Current Fare: Rs " . $fpResult['currentFare'] . "\n";
echo "  * Forecast in 15 mins: Rs " . $fpResult['projectedFareIn15'] . " (Savings: Rs " . $fpResult['savingsIn15'] . ")\n";
echo "  * Advisory: " . $fpResult['advice'] . "\n";

// 4. Test Bangalore Route (Koramangala to Whitefield)
echo "\n[4] Testing Bangalore Dynamic Route (Koramangala -> Whitefield):\n";
$blrResult = runTestEndpoint('handleMultimodalRoute', [
    'pickup' => 'Koramangala Sony World',
    'destination' => 'Whitefield Kadugodi'
]);
if (empty($blrResult['multimodalRoutes'])) {
    fwrite(STDERR, "FAILED: Missing Bangalore multimodalRoutes\n");
    exit(1);
}
echo "  * City: " . $blrResult['city'] . " (" . $blrResult['distanceKm'] . " km)\n";
echo "  * Multimodal Route 1: " . $blrResult['multimodalRoutes'][0]['title'] . " = Rs " . $blrResult['multimodalRoutes'][0]['totalFare'] . " (Save Rs " . $blrResult['multimodalRoutes'][0]['savings'] . ")\n";

echo "\n[PASS] ALL PHP BACKEND AI GOALS & DYNAMIC TESTS VERIFIED SUCCESSFULLY!\n";
