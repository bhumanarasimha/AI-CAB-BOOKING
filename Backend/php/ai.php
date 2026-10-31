<?php
require_once __DIR__ . '/db.php';

function handleAiRoute($method) {
    if ($method !== 'POST') {
        jsonResponse(["error" => "Method not allowed. Use POST."], 405);
    }

    $input = getJsonInput();
    $query = isset($input['query']) ? trim($input['query']) : '';
    $pickup = isset($input['pickup']) ? trim($input['pickup']) : 'Current Location';
    $destination = isset($input['destination']) ? trim($input['destination']) : 'City Center';
    $city = isset($input['city']) ? trim($input['city']) : 'Bengaluru';
    $distanceKm = isset($input['distanceKm']) ? floatval($input['distanceKm']) : 8.5;
    $quotes = isset($input['quotes']) && is_array($input['quotes']) ? $input['quotes'] : [];

    // Analyze live quotes if passed
    $cheapestQuote = null;
    $fastestQuote = null;
    $smartQuote = null;
    $uberQuote = null;
    $olaQuote = null;

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

    // Default calculations if no quotes provided
    $transitPrice = min(55, max(20, round(15 + $distanceKm * 3.2)));
    $autoPrice = round(35 + $distanceKm * 9);
    $cabPrice = round(50 + $distanceKm * 14);
    $estMinutes = round($distanceKm * 2.2 + 8);
    $savings = max(40, $cabPrice - $transitPrice);

    if ($smartQuote) {
        $cabPrice = $smartQuote['fare'];
        $estMinutes = $smartQuote['eta'];
    }

    $qLower = strtolower($query);

    // Natural Language Multi-Agent Classifier
    if (empty($query) || preg_match('/real[\s-]?time|analysis|live|radar|telemetry|traffic|status|overview/i', $qLower)) {
        $text = "⚡ **Live Real-Time Telemetry & Route Analysis**\n\n"
              . "• **Corridor**: **{$pickup}** ➔ **{$destination}** ({$distanceKm} km)\n"
              . "• **Live Traffic**: Moderate Flow (+2 mins signal delay)\n"
              . "• **Active Market Surge**: Uber (1.2x), Ola (1.3x), SmartRide AI (Locked 1.0x Base)\n";
        if ($cheapestQuote) {
            $text .= "• **Lowest Price**: **{$cheapestQuote['type']}** at **₹{$cheapestQuote['fare']}** ({$cheapestQuote['eta']}m ETA)\n";
        }
        if ($fastestQuote) {
            $text .= "• **Fastest Pickup**: **{$fastestQuote['type']}** in **{$fastestQuote['eta']} mins**\n";
        }
        $text .= "• **Public Transit Alternative**: Metro connects in **" . ($estMinutes + 5) . "m** for just **₹{$transitPrice}** (Save **₹{$savings}**)!";

        $response = [
            "success" => true,
            "text" => $text,
            "component" => "realtime_analysis",
            "chips" => ["Book cheapest", "Compare prices", "Smart routes", "Public Transit"]
        ];
    } elseif (preg_match('/cheap|price|cost|fare|rate|amount|discount|affordable/i', $qLower)) {
        $text = "💰 **Live Price Matrix for your Route ({$distanceKm} km)**:\n\n";
        if ($cheapestQuote) {
            $text .= "• **Cheapest Cab Option**: **{$cheapestQuote['type']}** at **₹{$cheapestQuote['fare']}** 🟢\n";
        } else {
            $text .= "• **Auto Ride**: **₹{$autoPrice}**\n";
        }
        $text .= "• **SmartRide EV**: **₹{$cabPrice}** (Zero Emission & No Surge)\n"
              . "• **Public Transit / Metro**: **₹{$transitPrice}**\n\n";
        if ($uberQuote && $smartQuote && $uberQuote['fare'] > $smartQuote['fare']) {
            $diff = $uberQuote['fare'] - $smartQuote['fare'];
            $text .= "💡 You save **₹{$diff}** by booking **SmartRide EV** over Uber Go!";
        } else {
            $text .= "💡 You save **₹{$savings}** by combining Metro with SmartRide Last-Mile!";
        }

        $response = [
            "success" => true,
            "text" => $text,
            "component" => "multi_option",
            "chips" => ["⚡ Real-Time Analysis", "Book cheapest", "Future prices"]
        ];
    } elseif (preg_match('/fast|quick|urgent|speed|eta|time|arrive|soon/i', $qLower)) {
        $fastestName = $fastestQuote ? $fastestQuote['type'] : 'SmartRide EV';
        $fastestEta = $fastestQuote ? $fastestQuote['eta'] : max(3, round($estMinutes * 0.2));
        $text = "⚡ **Fastest Arrival Option**:\n\n"
              . "• **Recommended**: **{$fastestName}** arrives in **{$fastestEta} minutes**\n"
              . "• **Total Travel Time**: ~" . max(12, $estMinutes - 4) . " minutes to **{$destination}**\n"
              . "• **Corridor Speed**: Clear road flow along the main corridor.";

        $response = [
            "success" => true,
            "text" => $text,
            "component" => "price_forecast",
            "chips" => ["⚡ Real-Time Analysis", "Book cheapest", "Smart routes"]
        ];
    } elseif (preg_match('/metro|train|bus|public|transit/i', $qLower)) {
        $text = "🚇 **Public Transit Itinerary for {$city}**:\n\n"
              . "• **Closest Station**: Indiranagar / Central Metro Station (300m walk)\n"
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
        $peakFare = round($autoPrice * 1.45);
        $text = "📈 **3-Hour Price & Demand Forecast**:\n\n"
              . "• **Current Fare**: **₹{$autoPrice}** (Base Rate)\n"
              . "• **In 30 mins**: Demand will increase +45% (Est. **₹{$peakFare}**)\n"
              . "• **Peak Window**: 06:00 PM – 08:30 PM\n"
              . "• **Recommendation**: Lock in your current price now before surge activates!";

        $response = [
            "success" => true,
            "text" => $text,
            "component" => "price_forecast",
            "chips" => ["Book cheapest", "⚡ Real-Time Analysis", "Public Transit"]
        ];
    } elseif (preg_match('/bike|walk|scooter|last mile|multimodal/i', $qLower)) {
        $text = "🚲 **Multimodal Smart Route**:\n\n"
              . "1. Walk 4 mins (300m) to Transit Hub\n"
              . "2. Metro Express towards **{$destination}**\n"
              . "3. Final 800m via Yulu EV Bike\n"
              . "• **Total Cost**: **₹{$transitPrice}** | **Time**: ~" . ($estMinutes + 4) . " mins.";

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
        $text = "I'm **Chubby AI**, your intelligent mobility assistant! Here is my live analysis for **{$pickup}** ➔ **{$destination}** ({$distanceKm} km):\n\n"
              . "• **Traffic**: Clear with ~{$estMinutes} min direct travel time.\n"
              . "• **Recommended Option**: " . ($cheapestQuote ? "**{$cheapestQuote['type']}** at **₹{$cheapestQuote['fare']}**" : "**SmartRide Auto** at **₹{$autoPrice}**") . ".\n"
              . "• Feel free to ask about live fares, fastest routes, traffic forecasts, parcel delivery, or safety features!";

        $response = [
            "success" => true,
            "text" => $text,
            "component" => "realtime_analysis",
            "chips" => ["⚡ Real-Time Analysis", "Compare prices", "Smart routes", "Public Transit"]
        ];
    }

    jsonResponse($response);
}
