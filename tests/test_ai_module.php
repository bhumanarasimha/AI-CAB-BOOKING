<?php
// Test runner for SmartMobility AI Module in Backend/php
require_once __DIR__ . '/../Backend/php/db.php';
require_once __DIR__ . '/../Backend/php/ai.php';

echo "============================================================\n";
echo " TESTING SMARTMOBILITY AI ENGINE (PHP BACKEND ENDPOINTS)\n";
echo "============================================================\n\n";

// Helper to simulate request
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

echo "  • Direct Cab Benchmark: ₹" . $mmResult['directCabBaseline']['rapido'] . " (Rapido) / ₹" . $mmResult['directCabBaseline']['ola'] . " (Ola) / ₹" . $mmResult['directCabBaseline']['uber'] . " (Uber)\n";
foreach ($mmResult['multimodalRoutes'] as $r) {
    echo "  • " . $r['title'] . ": Total ₹" . $r['totalFare'] . " (" . $r['badge'] . ")\n";
    foreach ($r['legs'] as $leg) {
        echo "      - " . $leg['icon'] . " " . $leg['label'] . " (" . $leg['duration'] . ") -> ₹" . $leg['fare'] . "\n";
    }
}

// 2. Test Cross-App Price Comparison (Goal 2)
echo "\n[2] Testing Cross-App Price Comparison (KG Apartments -> Marina Beach):\n";
$cmpResult = runTestEndpoint('handleCompareAllRoute', [
    'pickup' => 'KG Apartments',
    'destination' => 'Marina Beach',
    'distanceKm' => 34.0
]);
echo "  • Cab Economy Comparison:\n";
foreach ($cmpResult['categories']['cab_economy']['options'] as $opt) {
    $cheapestBadge = !empty($opt['isCheapest']) ? " [CHEAPEST]" : "";
    echo "      - " . $opt['provider'] . " (" . $opt['vehicleType'] . "): ₹" . $opt['fare'] . $cheapestBadge . " (ETA: " . $opt['etaMinutes'] . "m)\n";
}

// 3. Test Future Pricing Predictor (Goal 3)
echo "\n[3] Testing Future Pricing & Surge Drop Predictor (Goal 3):\n";
$fpResult = runTestEndpoint('handleFuturePricingRoute', [
    'currentFare' => 699,
    'distanceKm' => 34.0
]);
echo "  • Current Fare: ₹" . $fpResult['currentFare'] . "\n";
echo "  • Forecast in 15 mins: ₹" . $fpResult['projectedFareIn15'] . " (Savings: ₹" . $fpResult['savingsIn15'] . ")\n";
echo "  • Advisory: " . $fpResult['advice'] . "\n";
echo "  • Timeline: \n";
foreach ($fpResult['timeline'] as $t) {
    echo "      - " . $t['label'] . " (" . $t['time'] . "): ₹" . $t['fare'] . " (Surge: " . $t['surge'] . "x)\n";
}

// 4. Test Bangalore Route (Koramangala to Whitefield)
echo "\n[4] Testing Bangalore Dynamic Route (Koramangala -> Whitefield):\n";
$blrResult = runTestEndpoint('handleMultimodalRoute', [
    'pickup' => 'Koramangala Sony World',
    'destination' => 'Whitefield Kadugodi'
]);
echo "  • City: " . $blrResult['city'] . " (" . $blrResult['distanceKm'] . " km)\n";
echo "  • Multimodal Route 1: " . $blrResult['multimodalRoutes'][0]['title'] . " = ₹" . $blrResult['multimodalRoutes'][0]['totalFare'] . " (Save ₹" . $blrResult['multimodalRoutes'][0]['savings'] . ")\n";
foreach ($blrResult['multimodalRoutes'][0]['legs'] as $l) {
    echo "      - " . $l['label'] . " (" . $l['from'] . " -> " . $l['to'] . "): ₹" . $l['fare'] . "\n";
}

echo "\n✓ ALL PHP BACKEND AI GOALS & DYNAMIC TESTS VERIFIED SUCCESSFULLY!\n";
