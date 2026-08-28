package com.sevens.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Edge-to-edge: let the WebView draw under the status bar and gesture
        // nav bar instead of Android reserving that space for us. Below API
        // 35 this is opt-in; API 35+ enforces it regardless, so this just
        // makes the same behavior consistent on older devices too. The
        // corresponding web-side inset padding is src/ui/tokens.css's
        // --safe-top/--safe-bottom (env(safe-area-inset-*)), which only
        // becomes non-zero once the OS is actually drawing under those bars.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        super.onCreate(savedInstanceState);
    }
}
