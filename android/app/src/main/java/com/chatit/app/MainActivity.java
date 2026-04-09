package com.chatit.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Force edge-to-edge
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
    }
}
