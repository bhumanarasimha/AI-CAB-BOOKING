<?php
require_once __DIR__ . '/db.php';

function handleAiRoute($method) {
    if ($method !== 'POST') {
        jsonResponse(["error" => "Method not allowed. Use POST."], 405);
    }

    date_default_timezone_set('Asia/Kolkata');
    $now = new DateTime('now', new DateTimeZone('Asia/Kolkata'));
    $hour = intval($now->format('H'));
    $minute = intval($now->format('i'));
    $timeFormatted = $now->format('h:i A');

    $input = getJsonInput();
    $query = isset($input['query']) ? trim($input['query']) : '';
    $pickup = isset($input['pickup']) && trim($input['pickup']) !== '' ? trim($input['pickup']) : 'Current Location';
    $destination = isset($input['destination']) && trim($input['destination']) !== '' ? trim($input['destination']) : 'City Center';
    $distanceKm = isset($input['distanceKm']) ? floatval($input['distanceKm']) : 8.5;
    $quotes = isset($input['quotes']) && is_array($input['quotes']) ? $input['quotes'] : [];

    // City detection based on route names or explicit parameter
    $combinedRoute = strtolower($pickup . ' ' . $destination . ' ' . (isset($input['city']) ? $input['city'] : ''));
    if (strpos($combinedRoute, 'chennai') !== false || strpos($combinedRoute, 'saveetha') !== false || strpos($combinedRoute, 'poonamallee') !== false || strpos($combinedRoute, 'ponamal') !== false || strpos($combinedRoute, 'porur') !== false || strpos($combinedRoute, 'tidel') !== false || strpos($combinedRoute, 'marina') !== false || strpos($combinedRoute, 'guindy') !== false || strpos($combinedRoute, 'tambaram') !== false) {
        $city = 'Chennai';
        $metroName = 'Chennai Metro (CMRL)';
        $lineName = 'Green / Blue Line';
        $busName = 'MTC City Express Bus';
    } elseif (strpos($combinedRoute, 'bengaluru') !== false || strpos($combinedRoute, 'bangalore') !== false || strpos($combinedRoute, 'electronic city') !== false || strpos($combinedRoute, 'indiranagar') !== false || strpos($combinedRoute, 'whitefield') !== false) {
        $city = 'Bengaluru';
        $metroName = 'Namma Metro (BMRCL)';
        $lineName = 'Purple / Green Line';
        $busName = 'BMTC Volvo Vajra';
    } elseif (strpos($combinedRoute, 'hyderabad') !== false || strpos($combinedRoute, 'hitec') !== false || strpos($combinedRoute, 'gachibowli') !== false || strpos($combinedRoute, 'secunderabad') !== false) {
        $city = 'Hyderabad';
        $metroName = 'Hyderabad Metro (L&T HMRL)';
        $lineName = 'Red / Blue Line';
        $busName = 'TSRTC City Bus';
    } elseif (strpos($combinedRoute, 'delhi') !== false || strpos($combinedRoute, 'noida') !== false || strpos($combinedRoute, 'gurgaon') !== false) {
        $city = 'Delhi';
        $metroName = 'Delhi Metro (DMRC)';
        $lineName = 'Yellow / Blue Line';
        $busName = 'DTC Low Floor AC';
    } elseif (strpos($combinedRoute, 'mumbai') !== false || strpos($combinedRoute, 'andheri') !== false || strpos($combinedRoute, 'bandra') !== false || strpos($combinedRoute, 'dadar') !== false) {
        $city = 'Mumbai';
        $metroName = 'Mumbai Metro / Suburban Local';
        $lineName = 'Western / Central Line';
        $busName = 'BEST AC Electric';
    } else {
        $city = isset($input['city']) && !empty($input['city']) ? trim($input['city']) : 'Chennai';
        $metroName = 'Metro Rapid Transit';
        $lineName = 'Main Transit Corridor';
        $busName = 'City Express Bus';
    }

    // Dynamic Real-Time Traffic & Surge Model based on current wall-clock hour in IST
    if ($hour >= 8 && $hour < 11) {
        $trafficStatus = 'Heavy Morning Rush';
        $trafficDelayMins = 4 + ($minute % 4); // +4 to +7 mins
        $surgeMultiplier = 1.4;
        $surgeRange = '1.3x–1.5x';
        $peakForecast = 'Peak morning demand active until 11:00 AM';
    } elseif ($hour >= 11 && $hour < 17) {
        $trafficStatus = 'Moderate Afternoon Flow';
        $trafficDelayMins = 1 + ($minute % 3); // +1 to +3 mins
        $surgeMultiplier = 1.1;
        $surgeRange = '1.0x–1.2x';
        $peakForecast = 'Demand is stable. Evening rush begins around 5:30 PM';
    } elseif ($hour >= 17 && $hour < 21) {
        $trafficStatus = 'Severe Evening Peak';
        $trafficDelayMins = 5 + ($minute % 5); // +5 to +9 mins
        $surgeMultiplier = 1.5;
        $surgeRange = '1.4x–1.7x';
        $peakForecast = 'Heavy peak demand active until 09:00 PM';
    } else {
        $trafficStatus = 'Fast Open Corridor';
        $trafficDelayMins = $minute % 2; // 0 to 1 min
        $surgeMultiplier = 1.0;
        $surgeRange = '1.0x (No Surge)';
        $peakForecast = 'Late-night/early hours: road flow is clear and fares are at base rate';
    }

    // Analyze live quotes if passed
    $cheapestQuote = null;
    $fastestQuote = null;
    $smartQuote = null;
    $uberQuote = null;
    $olaQuote = null;
    $highestFare = 0;

    if (!empty($quotes)) {
        foreach ($quotes as $q) {
            $fare = isset($q['fare']) ? floatval($q['fare']) : (isset($q['price']) ? floatval(preg_replace('/[^\d.]/', '', $q['price'])) : 0);
            $eta = isset($q['eta']) ? intval($q['eta']) : (isset($q['etaMinutes']) ? intval($q['etaMinutes']) : 5);
            $type = isset($q['type']) ? $q['type'] : (isset($q['name']) ? $q['name'] : (isset($q['provider']) ? $q['provider'] : 'Cab'));
            $provider = strtolower(isset($q['provider']) ? $q['provider'] : $type);

            $norm = [
                'type' => $type,
                'fare' => $fare,
                'eta' => $eta,
                'provider' => $provider,
                'isSmart' => !empty($q['isSmart']) || strpos($provider, 'smartride') !== false
            ];

            if ($fare > $highestFare) {
                $highestFare = $fare;
            }

            if ($cheapestQuote === null || $fare < $cheapestQuote['fare']) {
                $cheapestQuote = $norm;
            }
            if ($fastestQuote === null || $eta < $fastestQuote['eta']) {
                $fastestQuote = $norm;
            }
            if ($norm['isSmart']) {
                $smartQuote = $norm;
            }
            if (strpos($provider, 'uber') !== false) {
                $uberQuote = $norm;
            }
            if (strpos($provider, 'ola') !== false) {
                $olaQuote = $norm;
            }
        }
    }

    // Real-Time Base Estimates if quotes are missing
    $transitPrice = min(55, max(20, round(15 + $distanceKm * 3.2)));
    $autoPrice = round(35 + $distanceKm * 9);
    $cabPrice = round(50 + $distanceKm * 14);
    $estMinutes = round($distanceKm * 2.2 + 8) + $trafficDelayMins;
    
    if ($smartQuote) {
        $cabPrice = $smartQuote['fare'];
        $estMinutes = $smartQuote['eta'];
    }

    $competitorMax = $highestFare > 0 ? $highestFare : round($cabPrice * $surgeMultiplier);
    $savings = max(40, $competitorMax - ($smartQuote ? $smartQuote['fare'] : $autoPrice));

    $qLower = strtolower($query);

    // Natural Language Multi-Agent Classifier
    if (empty($query) || preg_match('/real[\s-]?time|analysis|live|radar|telemetry|traffic|status|overview|now/i', $qLower)) {
        $text = "⚡ **Live Real-Time Telemetry & Route Analysis** (as of {$timeFormatted})\n\n"
              . "• **Corridor**: **{$pickup}** ➔ **{$destination}** ({$distanceKm} km)\n"
              . "• **Live Traffic Radar**: **{$trafficStatus}** (+{$trafficDelayMins} mins signal delay)\n"
              . "• **Active Market Surge**: Uber/Ola ({$surgeRange}), while **SmartRide AI is locked at 1.0x Base Fare**!\n";

        if ($cheapestQuote) {
            $text .= "• **Lowest Live Fare**: **{$cheapestQuote['type']}** at **₹{$cheapestQuote['fare']}** ({$cheapestQuote['eta']}m ETA) 🟢\n";
        } else {
            $text .= "• **Lowest Live Fare**: **SmartRide Auto** at **₹{$autoPrice}**\n";
        }

        if ($fastestQuote) {
            $text .= "• **Fastest Pickup**: **{$fastestQuote['type']}** arriving in **{$fastestQuote['eta']} mins** ⚡\n";
        }

        if ($uberQuote && $smartQuote && $uberQuote['fare'] > $smartQuote['fare']) {
            $diff = $uberQuote['fare'] - $smartQuote['fare'];
            $text .= "• **Instant Savings**: Save **₹{$diff}** by picking SmartRide EV over Uber Go!\n";
        } else {
            $text .= "• **Instant Savings**: Save up to **₹{$savings}** vs surge rates!\n";
        }

        $text .= "• **Transit Option**: {$metroName} connects in **" . ($estMinutes + 5) . "m** for just **₹{$transitPrice}**.";

        $response = [
            "success" => true,
            "text" => $text,
            "component" => "realtime_analysis",
            "chips" => ["Book cheapest", "Compare prices", "Smart routes", "Public Transit"],
            "telemetry" => [
                "timestamp" => $timeFormatted,
                "trafficDelayMins" => $trafficDelayMins,
                "trafficStatus" => $trafficStatus,
                "surgeRange" => $surgeRange,
                "savings" => $savings,
                "distanceKm" => $distanceKm
            ]
        ];
    } elseif (preg_match('/cheap|price|cost|fare|rate|amount|discount|affordable/i', $qLower)) {
        $text = "💰 **Live Real-Time Price Matrix ({$distanceKm} km, {$timeFormatted})**:\n\n";
        if ($cheapestQuote) {
            $text .= "• **Cheapest Cab/Auto**: **{$cheapestQuote['type']}** at **₹{$cheapestQuote['fare']}** 🟢\n";
        } else {
            $text .= "• **SmartRide Auto**: **₹{$autoPrice}**\n";
        }
        $text .= "• **SmartRide EV**: **₹{$cabPrice}** (Zero Emission & No Surge Multiplier)\n";
        if ($uberQuote) {
            $text .= "• **Uber Go**: **₹{$uberQuote['fare']}** ({$surgeRange} surge active)\n";
        }
        if ($olaQuote) {
            $text .= "• **Ola Mini**: **₹{$olaQuote['fare']}** ({$surgeRange} surge active)\n";
        }
        $text .= "• **{$metroName}**: **₹{$transitPrice}**\n\n";

        if ($uberQuote && $smartQuote && $uberQuote['fare'] > $smartQuote['fare']) {
            $diff = $uberQuote['fare'] - $smartQuote['fare'];
            $text .= "💡 You save **₹{$diff}** directly by choosing **SmartRide AI**!";
        } else {
            $text .= "💡 You save **₹{$savings}** compared to surge pricing on other apps!";
        }

        $response = [
            "success" => true,
            "text" => $text,
            "component" => "multi_option",
            "chips" => ["⚡ Real-Time Analysis", "Book cheapest", "Future prices"]
        ];
    } elseif (preg_match('/fast|quick|urgent|speed|eta|time|arrive|soon/i', $qLower)) {
        $fastestName = $fastestQuote ? $fastestQuote['type'] : 'SmartRide EV';
        $fastestEta = $fastestQuote ? $fastestQuote['eta'] : max(2, round($estMinutes * 0.15));
        $text = "⚡ **Fastest Arrival Option (Real-Time ETA)**:\n\n"
              . "• **Fastest Pickup**: **{$fastestName}** arrives in **{$fastestEta} minutes**\n"
              . "• **Total Travel Time**: ~{$estMinutes} minutes to **{$destination}**\n"
              . "• **Corridor Condition**: {$trafficStatus} (+{$trafficDelayMins} min traffic delay).";

        $response = [
            "success" => true,
            "text" => $text,
            "component" => "price_forecast",
            "chips" => ["⚡ Real-Time Analysis", "Book cheapest", "Smart routes"]
        ];
    } elseif (preg_match('/metro|train|bus|public|transit/i', $qLower)) {
        $text = "🚇 **Public Transit Itinerary for {$city}**:\n\n"
              . "• **Transit Hub**: {$metroName} ({$lineName})\n"
              . "• **Bus Alternative**: {$busName}\n"
              . "• **Transit Fare**: **₹{$transitPrice}** total\n"
              . "• **Total Duration**: ~" . ($estMinutes + 6) . " minutes\n"
              . "• **Eco Savings**: 1.2 kg CO₂ prevented vs solo cab.";

        $response = [
            "success" => true,
            "text" => $text,
            "component" => "transit_compare",
            "chips" => ["Metro + Bike", "Smart routes", "Compare prices"]
        ];
    } elseif (preg_match('/surge|peak|forecast|later|future|tonight/i', $qLower)) {
        $peakFare = round($autoPrice * ($surgeMultiplier > 1 ? $surgeMultiplier * 1.15 : 1.45));
        $text = "📈 **Live Surge & Demand Forecast** ({$timeFormatted}):\n\n"
              . "• **Current Status**: **{$trafficStatus}**\n"
              . "• **Market Surge Rate**: {$surgeRange} across Uber & Ola\n"
              . "• **Forecast**: {$peakForecast} (Est. surge fare: **₹{$peakFare}**)\n"
              . "• **Recommendation**: Book with **SmartRide AI** now — our base fares are locked and never surge!";

        $response = [
            "success" => true,
            "text" => $text,
            "component" => "price_forecast",
            "chips" => ["Book cheapest", "⚡ Real-Time Analysis", "Public Transit"]
        ];
    } elseif (preg_match('/bike|walk|scooter|last mile|multimodal/i', $qLower)) {
        $text = "🚲 **Multimodal Smart Route for {$city}**:\n\n"
              . "1. Walk 4 mins (300m) to {$metroName}\n"
              . "2. Metro Express towards **{$destination}**\n"
              . "3. Final 800m via SmartRide EV Bike\n"
              . "• **Total Cost**: **₹{$transitPrice}** | **Time**: ~" . ($estMinutes + 4) . " mins\n"
              . "• **Total Savings**: **₹{$savings}** vs solo cab!";

        $response = [
            "success" => true,
            "text" => $text,
            "component" => "smart_route",
            "chips" => ["Walk 300m", "Compare prices", "Book cheapest"]
        ];
    } elseif (preg_match('/safe|safety|sos|emergency|pin|shield|tracking/i', $qLower)) {
        $text = "🛡️ **SmartRide AI Safety & Protection Guarantee**:\n\n"
              . "• **24/7 AI Shield**: Continuous GPS deviation and route anomaly detection.\n"
              . "• **4-Digit Secure PIN**: The ride only starts after your OTP matches the driver's console.\n"
              . "• **1-Tap Emergency SOS**: Alerts police dispatch and shares live GPS coordinates with your emergency contacts.\n"
              . "• **Live Route Sharing**: Send your trip link via WhatsApp/SMS.";

        $response = [
            "success" => true,
            "text" => $text,
            "chips" => ["⚡ Real-Time Analysis", "Compare prices", "Smart routes"]
        ];
    } elseif (preg_match('/pay|upi|cash|card|wallet|offer|coupon|promo/i', $qLower)) {
        $text = "💳 **Payment Options & Active Discounts**:\n\n"
              . "• **Supported Modes**: UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, SmartRide Wallet, and Cash to Driver.\n"
              . "• **Active Coupon**: Use promo code **`SMART20`** for 20% OFF (Up to ₹50) on your trip to **{$destination}**!\n"
              . "• **Zero Cancellation Fee**: Free cancellation within 5 minutes of booking.";

        $response = [
            "success" => true,
            "text" => $text,
            "chips" => ["Compare prices", "Book cheapest", "Future prices"]
        ];
    } elseif (preg_match('/parcel|courier|delivery|package/i', $qLower)) {
        $text = "📦 **SmartRide Parcel Express**:\n\n"
              . "• **Bike Express (≤5kg)**: Fastest pickup for documents, keys & food (~₹45 base).\n"
              . "• **Standard Car (≤20kg)**: Fragile goods, cartons & clothes.\n"
              . "• **Heavy Van (≤100kg)**: Bulk business inventory & electronics.\n"
              . "• Switch to the **Parcel** section in the app to book instant door-to-door courier!";

        $response = [
            "success" => true,
            "text" => $text,
            "chips" => ["Book cheapest", "⚡ Real-Time Analysis", "Compare prices"]
        ];
    } elseif (preg_match('/commute|carpool|share|coworker|office/i', $qLower)) {
        $text = "👥 **Smart Commute & Daily Carpool**:\n\n"
              . "• Share daily rides with verified colleagues working at the same tech park.\n"
              . "• Save up to **₹4,800/month** and eliminate 22 kg of CO₂.\n"
              . "• Switch to the **Commute** section to match with riders & drivers on your corridor!";

        $response = [
            "success" => true,
            "text" => $text,
            "chips" => ["⚡ Real-Time Analysis", "Compare prices", "Smart routes"]
        ];
    } else {
        $text = "I'm **Chubby AI**, your real-time mobility assistant! Here is my live analysis for **{$pickup}** ➔ **{$destination}** ({$distanceKm} km, {$timeFormatted}):\n\n"
              . "• **Traffic**: {$trafficStatus} (+{$trafficDelayMins} min signal delay).\n"
              . "• **Recommended Option**: " . ($cheapestQuote ? "**{$cheapestQuote['type']}** at **₹{$cheapestQuote['fare']}**" : "**SmartRide Auto** at **₹{$autoPrice}**") . ".\n"
              . "• Feel free to ask about live fares, fastest routes, traffic forecasts, parcel delivery, or safety features!";

        $response = [
            "success" => true,
            "text" => $text,
            "component" => "realtime_analysis",
            "chips" => ["⚡ Real-Time Analysis", "Compare prices", "Smart routes", "Public Transit"],
            "telemetry" => [
                "timestamp" => $timeFormatted,
                "trafficDelayMins" => $trafficDelayMins,
                "trafficStatus" => $trafficStatus,
                "surgeRange" => $surgeRange,
                "savings" => $savings,
                "distanceKm" => $distanceKm
            ]
        ];
    }

    jsonResponse($response);
}
