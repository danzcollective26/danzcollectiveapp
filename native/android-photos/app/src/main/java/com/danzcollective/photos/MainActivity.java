package com.danzcollective.photos;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.ScrollView;
import java.io.File;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

public final class MainActivity extends Activity {
    private static final String DANZ_URL = "https://danz-collective-demo.right-vine-9666.chatgpt.site/?seccion=fotos&androidFotos=activado&actualizar=31";
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private Future<?> operation;
    private int generation;
    private TextView status;
    private LinearLayout layout;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        layout = new LinearLayout(this); layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(dp(28), dp(48), dp(28), dp(28)); layout.setBackgroundColor(Color.rgb(11,11,11));
        layout.setGravity(Gravity.CENTER_HORIZONTAL);
        layout.setFitsSystemWindows(true);
        ImageView flower = new ImageView(this); flower.setImageResource(R.drawable.ic_danz);
        layout.addView(flower, new LinearLayout.LayoutParams(dp(80), dp(80)));
        TextView title = new TextView(this); title.setText("DANZ FOTOS"); title.setTextSize(28); title.setTextColor(Color.WHITE); title.setPadding(0,dp(26),0,dp(20));
        layout.addView(title);
        status = new TextView(this); status.setTextColor(Color.rgb(200,200,200)); status.setTextSize(17); status.setLineSpacing(dp(5),1);
        layout.addView(status, new LinearLayout.LayoutParams(-1,-2));
        ScrollView scroll = new ScrollView(this); scroll.addView(layout); setContentView(scroll);
        accept(getIntent());
    }
    @Override public void onNewIntent(Intent intent) { super.onNewIntent(intent); setIntent(intent); accept(intent); }
    private void accept(Intent intent) {
        int current = ++generation;
        if (operation != null) operation.cancel(true);
        while (layout.getChildCount() > 3) layout.removeViewAt(3);
        if (intent.getData() == null) {
            status.setText("Este complemento guarda tus fotos en la galería de Android, en el álbum DANZ.\n\nAbre una foto en DANZ y pulsa «Guardar en Fotos · Android». Tu cuenta y tu acceso siguen en el navegador.");
            button("ABRIR DANZ", this::openDanz);
            return;
        }
        final PhotoRequest request;
        try { request = PhotoRequest.parse(intent.getData().toString()); }
        catch (RuntimeException ignored) { status.setText("No podemos abrir esta solicitud. Vuelve a DANZ y selecciona la foto otra vez."); button("VOLVER A DANZ", this::openDanz); return; }
        status.setText("Guardando tu foto en la galería…\n\n" + request.name);
        operation = worker.submit(() -> {
            File temporary = null;
            try {
                temporary = PhotoIO.receive(request, getCacheDir());
                final Uri saved = PhotoAlbum.save(this, request, temporary);
                runOnUiThread(() -> {
                    if (isFinishing() || isDestroyed() || current != generation) return;
                    status.setText("Foto guardada y comprobada.\n\n" + request.name + "\n\nLa encontrarás en la galería del móvil, dentro del álbum DANZ. La copia en la nube de Google Fotos depende de tus ajustes de copia de seguridad.");
                    button("COMPARTIR FOTO", () -> share(saved, request, false));
                    if (!BuildConfig.META_APP_ID.isEmpty()) button("ABRIR EN STORIES", () -> share(saved, request, true));
                    button("VOLVER A DANZ", this::finish);
                    if (request.story) share(saved, request, !BuildConfig.META_APP_ID.isEmpty());
                });
            } catch (Exception ignored) {
                runOnUiThread(() -> {
                    if (isFinishing() || isDestroyed() || current != generation) return;
                    status.setText("No se pudo guardar una foto completa. No se ha dejado un archivo vacío en la galería.\n\nVuelve a DANZ, abre de nuevo la foto y comprueba tu conexión y el espacio del móvil.");
                    button("VOLVER A DANZ", this::finish);
                });
            } finally { if (temporary != null) temporary.delete(); }
        });
    }
    private void share(Uri photo, PhotoRequest request, boolean story) {
        try {
            Intent intent;
            if (story) {
                intent = new Intent("com.instagram.share.ADD_TO_STORY");
                intent.setPackage("com.instagram.android"); intent.setDataAndType(photo, request.mime);
                intent.putExtra("source_application", BuildConfig.META_APP_ID);
                grantUriPermission("com.instagram.android", photo, Intent.FLAG_GRANT_READ_URI_PERMISSION);
            } else {
                intent = new Intent(Intent.ACTION_SEND); intent.setType(request.mime); intent.putExtra(Intent.EXTRA_STREAM, photo);
            }
            intent.setClipData(ClipData.newUri(getContentResolver(), request.name, photo));
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(story ? intent : Intent.createChooser(intent, "Compartir foto DANZ"));
        } catch (ActivityNotFoundException | SecurityException ignored) {
            status.setText("La foto ya está guardada en el álbum DANZ. No se pudo abrir el destino para compartir; puedes seleccionarla desde tu galería.");
        }
    }
    private void openDanz() {
        try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(DANZ_URL)).setPackage("com.android.chrome")); }
        catch (ActivityNotFoundException missingChrome) {
            try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(DANZ_URL))); }
            catch (ActivityNotFoundException ignored) { status.setText("Abre DANZ en tu navegador habitual."); }
        }
    }
    private void button(String label, Runnable action) {
        Button button = new Button(this); button.setText(label); button.setTextColor(Color.BLACK); button.setBackgroundTintList(android.content.res.ColorStateList.valueOf(Color.rgb(219,255,102)));
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(-1,dp(56)); params.topMargin = dp(20);
        layout.addView(button,params); button.setOnClickListener(view -> action.run());
    }
    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }
    @Override public void onDestroy() { generation++; if (operation != null) operation.cancel(true); worker.shutdownNow(); super.onDestroy(); }
}
