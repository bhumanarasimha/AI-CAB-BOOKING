package com.example.airidebooking;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.webkit.WebViewAssetLoader;

import java.util.Objects;

public class MainActivity extends AppCompatActivity {

    private static final String TAG = "MainActivity";
    private static final int LOCATION_PERMISSION_REQUEST_CODE = 1;
    private static final String APP_ASSETS_HOST = "appassets.androidplatform.net";

    private WebView webView;
    private String pendingOrigin;
    private GeolocationPermissions.Callback pendingCallback;

    public static class WebAppInterface {
        private final MainActivity activity;

        public WebAppInterface(MainActivity activity) {
            this.activity = activity;
        }

        @JavascriptInterface
        public void openExternalApp(String appUrl, String fallbackWebUrl) {
            activity.runOnUiThread(() -> {
                if (appUrl != null && !appUrl.trim().isEmpty()) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(appUrl.trim()));
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        activity.startActivity(intent);
                        return;
                    } catch (Exception e) {
                        Log.e(TAG, "Error launching appUrl: " + appUrl, e);
                    }
                }
                if (fallbackWebUrl != null && !fallbackWebUrl.trim().isEmpty()) {
                    try {
                        Intent fallbackIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(fallbackWebUrl.trim()));
                        fallbackIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        activity.startActivity(fallbackIntent);
                    } catch (Exception e) {
                        Log.e(TAG, "Error launching fallbackWebUrl: " + fallbackWebUrl, e);
                    }
                }
            });
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    @SuppressWarnings("deprecation")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);

        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setGeolocationEnabled(true);
        webSettings.setMediaPlaybackRequiresUserGesture(false);
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        webSettings.setSupportMultipleWindows(false);
        webSettings.setJavaScriptCanOpenWindowsAutomatically(true);

        // Essential for React/Vite local loading
        webSettings.setAllowContentAccess(true);
        webSettings.setAllowFileAccessFromFileURLs(true);
        webSettings.setAllowUniversalAccessFromFileURLs(true);

        // Bridge to allow frontend to open installed cab apps
        webView.addJavascriptInterface(new WebAppInterface(this), "AndroidApp");

        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .setDomain(APP_ASSETS_HOST)
                .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if (url != null && Objects.equals(url.getHost(), APP_ASSETS_HOST)) {
                    WebResourceResponse response = assetLoader.shouldInterceptRequest(url);
                    if (response != null) {
                        return response;
                    }
                    return assetLoader.shouldInterceptRequest(Uri.parse("https://" + APP_ASSETS_HOST + "/index.html"));
                }
                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if (url != null) {
                    if (Objects.equals(url.getHost(), APP_ASSETS_HOST)) {
                        return false;
                    }
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, url);
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        Log.e(TAG, "Error overriding URL loading for: " + url, e);
                    }
                }
                return false;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                    pendingOrigin = origin;
                    pendingCallback = callback;
                    ActivityCompat.requestPermissions(MainActivity.this, new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, LOCATION_PERMISSION_REQUEST_CODE);
                } else {
                    callback.invoke(origin, true, false);
                }
            }
        });

        // Request location permission on startup so geolocation works immediately
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            }, LOCATION_PERMISSION_REQUEST_CODE);
        }

        // Handle Back button for WebView
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });

        // Load via the virtual domain to support React Router
        webView.loadUrl("https://" + APP_ASSETS_HOST + "/index.html");
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == LOCATION_PERMISSION_REQUEST_CODE) {
            boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            if (pendingCallback != null) {
                pendingCallback.invoke(pendingOrigin, granted, false);
                pendingCallback = null;
                pendingOrigin = null;
            }
        }
    }
}