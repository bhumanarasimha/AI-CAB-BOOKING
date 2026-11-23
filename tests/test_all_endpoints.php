<?php
// Script to run PHP CLI checks
$testType = $argv[1] ?? 'multimodal_kg';

require_once __DIR__ . '/../Backend/php/db.php';
require_once __DIR__ . '/../Backend/php/ai.php';

// Override input stream simulation
function setInput($data) {
    file_put_contents(__DIR__ . '/test_input.json', json_encode($data));
}

if ($testType === 'multimodal_kg') {
    echo "=== MULTIMODAL TEST: KG Apartments to Marina Beach ===\n";
    // Mock getJsonInput
    $_SERVER['REQUEST_METHOD'] = 'POST';
    handleMultimodalRoute('POST');
} elseif ($testType === 'multimodal_bangalore') {
    echo "=== MULTIMODAL TEST: Bangalore Koramangala to Whitefield ===\n";
    handleMultimodalRoute('POST');
} elseif ($testType === 'compare_all') {
    echo "=== COMPARE ALL TEST ===\n";
    handleCompareAllRoute('POST');
} elseif ($testType === 'future_pricing') {
    echo "=== FUTURE PRICING TEST ===\n";
    handleFuturePricingRoute('POST');
}
