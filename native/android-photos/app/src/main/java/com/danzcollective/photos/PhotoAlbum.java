package com.danzcollective.photos;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.graphics.BitmapFactory;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Environment;
import android.provider.MediaStore;
import java.io.*;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/** Publish the unchanged original into a concrete shared-storage volume. */
public final class PhotoAlbum {
    private PhotoAlbum() {}
    public static final class SavedPhoto {
        public final Uri uri;
        public final String name, folder;
        public final long bytes;
        public final int width, height;
        public final boolean indexed;
        SavedPhoto(Uri uri, String name, String folder, long bytes, int width, int height, boolean indexed) {
            this.uri=uri; this.name=name; this.folder=folder; this.bytes=bytes; this.width=width; this.height=height; this.indexed=indexed;
        }
    }
    private interface Source { InputStream open() throws IOException; }
    public static SavedPhoto save(Context context, PhotoRequest request, File source) throws Exception {
        BitmapFactory.Options bounds = new BitmapFactory.Options(); bounds.inJustDecodeBounds = true;
        BitmapFactory.decodeFile(source.getAbsolutePath(), bounds);
        if (bounds.outWidth < 1 || bounds.outHeight < 1) throw new IOException("Unreadable photo");
        Uri collection = MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
        return copy(context, request, () -> new FileInputStream(source), collection,
                Environment.DIRECTORY_DCIM + "/DANZ/", bounds.outWidth, bounds.outHeight, true);
    }
    public static SavedPhoto copyToDownloads(Context context, PhotoRequest request, SavedPhoto source) throws Exception {
        Uri collection = MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
        return copy(context, request, () -> context.getContentResolver().openInputStream(source.uri), collection,
                Environment.DIRECTORY_DOWNLOADS + "/DANZ/", source.width, source.height, false);
    }
    private static SavedPhoto copy(Context context, PhotoRequest request, Source source, Uri collection,
                                   String folder, int width, int height, boolean gallery) throws Exception {
        PhotoIO.checkCancelled();
        ContentResolver resolver = context.getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.MediaColumns.DISPLAY_NAME, request.name);
        values.put(MediaStore.MediaColumns.MIME_TYPE, request.mime);
        values.put(MediaStore.MediaColumns.RELATIVE_PATH, folder);
        values.put(MediaStore.MediaColumns.IS_PENDING, 1);
        Uri destination = resolver.insert(collection, values);
        if (destination == null) throw new IOException("No file destination");
        boolean committed = false;
        try {
            try (InputStream input = source.open(); OutputStream output = resolver.openOutputStream(destination, "w")) {
                if (input == null || output == null) throw new IOException("Cannot copy photo");
                PhotoIO.verify(input, output, request);
            }
            try (InputStream saved = resolver.openInputStream(destination)) {
                if (saved == null) throw new IOException("Cannot check saved photo");
                PhotoIO.verify(saved, null, request);
            }
            PhotoIO.checkCancelled();
            values.clear(); values.put(MediaStore.MediaColumns.IS_PENDING, 0);
            if (resolver.update(destination, values, null, null) != 1) throw new IOException("Cannot publish saved photo");
            committed = true;
            if (gallery) refreshGallery(context, destination, collection, request.mime);
            String actualName = request.name;
            boolean indexed = false;
            String[] columns = {MediaStore.MediaColumns.DISPLAY_NAME, MediaStore.MediaColumns.MIME_TYPE,
                    MediaStore.MediaColumns.SIZE, MediaStore.MediaColumns.IS_PENDING,
                    MediaStore.MediaColumns.WIDTH, MediaStore.MediaColumns.HEIGHT};
            try (Cursor row = resolver.query(destination, columns, null, null, null)) {
                if (row != null && row.moveToFirst()) {
                    actualName = row.getString(0);
                    indexed = request.mime.equalsIgnoreCase(row.getString(1)) && row.getLong(2) == request.bytes && row.getInt(3) == 0
                            && (!gallery || row.getInt(4) > 0 && row.getInt(5) > 0);
                }
            } catch (RuntimeException ignored) { /* A readable file can precede an OEM gallery refresh. */ }
            return new SavedPhoto(destination, actualName, folder, request.bytes, width, height, indexed);
        } finally { if (!committed) resolver.delete(destination, null, null); }
    }
    private static void refreshGallery(Context context, Uri photo, Uri collection, String mime) {
        ContentResolver resolver = context.getContentResolver();
        // Read the provider's path ONLY for the row just created, to request a scan.
        // All file writes remain scoped ContentResolver operations.
        try (Cursor row = resolver.query(photo, new String[]{MediaStore.MediaColumns.DATA}, null, null, null)) {
            if (row != null && row.moveToFirst() && row.getString(0) != null) {
                CountDownLatch scanned = new CountDownLatch(1);
                MediaScannerConnection.scanFile(context, new String[]{row.getString(0)}, new String[]{mime}, (path, result) -> scanned.countDown());
                scanned.await(3, TimeUnit.SECONDS);
            }
        } catch (InterruptedException cancelled) { Thread.currentThread().interrupt(); }
        catch (RuntimeException ignored) { /* MediaStore still owns the verified file. */ }
        try { resolver.notifyChange(photo, null); resolver.notifyChange(collection, null); }
        catch (RuntimeException ignored) { /* Provider-managed notifications remain available. */ }
    }
}
