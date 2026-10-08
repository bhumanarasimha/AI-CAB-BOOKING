plugins {
    alias(libs.plugins.android.application)
}

android {
    namespace = "com.example.airidebooking"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.example.airidebooking"
        minSdk = 24
        targetSdk = 37
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
dependencies {

    implementation(libs.activity.ktx)
    implementation(libs.appcompat)
    implementation(libs.constraintlayout)
    implementation(libs.material)

    // Google Maps
    implementation(libs.play.services.maps)

    // Current Location
    implementation(libs.play.services.location)

    // Google Places API
    implementation(libs.places)

    // Image Loading
    implementation(libs.glide)
    
    // Coroutines
    implementation(libs.kotlinx.coroutines.android)

    // WebView Asset Loader
    implementation(libs.webkit)

    testImplementation(libs.junit)
    androidTestImplementation(libs.espresso.core)
    androidTestImplementation(libs.ext.junit)
}