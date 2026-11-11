package com.danzcollective.photos;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;

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
        TextView title = new TextView(this); title.setText("DANZ FOTOS · 0.2"); title.setTextSize(28); title.setTextColor(Color.WHITE); title.setPadding(0,dp(26),0,dp(20));
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
            status.setText("Este complemento guarda tus fotos en la galería de Android, en DCIM/DANZ.\n\nAbre una foto en DANZ y pulsa «Guardar en Fotos · Android». Tu cuenta y tu acceso siguen en el navegador.");
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
                final PhotoAlbum.SavedPhoto saved = PhotoAlbum.save(this, request, temporary);
                runOnUiThread(() -> {
                    if (isFinishing() || isDestroyed() || current != generation) return;
                    status.setText(savedDescription(saved) + (saved.indexed
                            ? "\n\nAndroid ha registrado la foto para la galería."
                            : "\n\nEl archivo está completo. La galería de Android sigue actualizando su índice; puedes abrirlo directamente.")
                            + "\n\nConserva el formato, las dimensiones y la calidad del original. Algunas galerías ordenan por la fecha original de la foto.");
                    button("ABRIR FOTO GUARDADA", () -> openSaved(saved.uri, request.mime));
                    Button downloads = button("GUARDAR COPIA EN DESCARGAS", () -> {});
                    downloads.setOnClickListener(view -> saveDownloads(saved, request, downloads, current));
                    button("COMPARTIR FOTO", () -> share(saved.uri, request, false));
                    if (!BuildConfig.META_APP_ID.isEmpty()) button("ABRIR EN STORIES", () -> share(saved.uri, request, true));
                    button("VOLVER A DANZ", this::finish);
                    if (request.story) share(saved.uri, request, !BuildConfig.META_APP_ID.isEmpty());
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
    private String savedDescription(PhotoAlbum.SavedPhoto photo) {
        return "Archivo original guardado y comprobado.\n\n" + photo.name + "\n" + photo.width + " × " + photo.height + " px · "
                + String.format(java.util.Locale.forLanguageTag("es-ES"), "%.1f KB", photo.bytes / 1024.0) + "\nCarpeta: " + photo.folder;
    }
    private void openSaved(Uri photo, String mime) {
        Intent view = new Intent(Intent.ACTION_VIEW).setDataAndType(photo, mime);
        view.setClipData(ClipData.newUri(getContentResolver(), "Foto DANZ", photo));
        view.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        try { startActivity(Intent.createChooser(view, "Abrir foto guardada")); }
        catch (ActivityNotFoundException | SecurityException ignored) {
            status.append("\n\nNo se pudo abrir el visor del móvil. Puedes guardar otra copia en Descargas o compartir el archivo.");
        }
    }
    private void saveDownloads(PhotoAlbum.SavedPhoto photo, PhotoRequest request, Button button, int current) {
        button.setEnabled(false); button.setText("GUARDANDO COPIA…");
        operation = worker.submit(() -> {
            try {
                PhotoAlbum.SavedPhoto copy = PhotoAlbum.copyToDownloads(this, request, photo);
                runOnUiThread(() -> {
                    if (isFinishing() || isDestroyed() || current != generation) return;
                    status.setText(savedDescription(copy) + "\n\nLa copia original de la galería también se conserva.");
                    button.setText("ABRIR COPIA DE DESCARGAS"); button.setEnabled(true);
                    button.setOnClickListener(view -> openSaved(copy.uri, request.mime));
                });
            } catch (Exception ignored) {
                runOnUiThread(() -> {
                    if (isFinishing() || isDestroyed() || current != generation) return;
                    status.append("\n\nNo se pudo crear la copia en Descargas. La foto de DCIM/DANZ sigue guardada.");
                    button.setText("REINTENTAR COPIA EN DESCARGAS"); button.setEnabled(true);
                });
            }
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
    private Button button(String label, Runnable action) {
        Button button = new Button(this); button.setText(label); button.setTextColor(Color.BLACK); button.setBackgroundTintList(android.content.res.ColorStateList.valueOf(Color.rgb(219,255,102)));
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(-1,dp(56)); params.topMargin = dp(20);
        layout.addView(button,params); button.setOnClickListener(view -> action.run()); return button;
    }
    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }
    @Override public void onDestroy() { generation++; if (operation != null) operation.cancel(true); worker.shutdownNow(); super.onDestroy(); }
}
