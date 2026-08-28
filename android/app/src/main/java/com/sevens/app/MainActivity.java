package com.sevens.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    // Android 15+ (API 35, this app's target) enforces edge-to-edge for every
    // app and turns Window#setStatusBarColor/setNavigationBarColor into
    // no-ops — the classic "just recolor the bars" approach silently stopped
    // working on current devices, and the OS was painting its own default
    // grey scrim behind them instead. This opts in explicitly and the web
    // side draws its own background through the now-transparent bars (see
    // index.html's viewport-fit=cover and --safe-top/--safe-bottom in
    // src/ui/tokens.css, which pad content clear of both bars).
    //
    // An earlier attempt at this exact thing was reverted after the tab bar
    // went missing on-device — verified this time against a real device via
    // adb before shipping it again.
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}
