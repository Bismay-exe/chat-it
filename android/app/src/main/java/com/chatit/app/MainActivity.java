package com.chatit.app;

import android.os.Bundle;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);

        // Enable true edge-to-edge: content draws behind status bar & nav bar
        // This removes the default semi-transparent scrim Android adds
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}
