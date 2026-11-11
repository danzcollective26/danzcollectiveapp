package com.danzcollective.photos;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Environment;
import android.provider.MediaStore;
import java.io.*;

/** Android 10+: publish into Pictures/DANZ only after a verified write. */
public final class PhotoAlbum {
    private PhotoAlbum() {}
    public static Uri save(Context context, PhotoRequest request, File source) throws Exception {
        BitmapFactory.Options bounds = new BitmapFactory.Options(); bounds.inJustDecodeBounds = true;
        BitmapFactory.decodeFile(source.getAbsolutePath(), bounds);
        if (bounds.outWidth < 1 || bounds.outHeight < 1) throw new IOException("Unreadable photo");
        PhotoIO.checkCancelled();
        ContentResolver resolver = context.getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.Images.Media.DISPLAY_NAME, request.name);
        values.put(MediaStore.Images.Media.MIME_TYPE, request.mime);
        values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/DANZ");
        values.put(MediaStore.Images.Media.IS_PENDING, 1);
        values.put(MediaStore.Images.Media.DATE_EXPIRES, System.currentTimeMillis() / 1000 + 3600);
        Uri destination = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
        if (destination == null) throw new IOException("No gallery destination");
        boolean committed = false;
        try {
            try (InputStream input = new FileInputStream(source); OutputStream output = resolver.openOutputStream(destination, "w")) {
                if (output == null) throw new IOException("Cannot write photo");
                PhotoIO.verify(input, output, request);
            }
            try (InputStream saved = resolver.openInputStream(destination)) {
                if (saved == null) throw new IOException("Cannot check saved photo");
                PhotoIO.verify(saved, null, request);
            }
            PhotoIO.checkCancelled();
            values.clear(); values.put(MediaStore.Images.Media.IS_PENDING, 0); values.putNull(MediaStore.Images.Media.DATE_EXPIRES);
            if (resolver.update(destination, values, null, null) != 1) throw new IOException("Cannot publish saved photo");
            committed = true;
            return destination;
        } finally { if (!committed) resolver.delete(destination, null, null); }
    }
}
