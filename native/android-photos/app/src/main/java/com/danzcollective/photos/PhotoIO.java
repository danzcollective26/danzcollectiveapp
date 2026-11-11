package com.danzcollective.photos;

import java.io.*;
import java.net.HttpURLConnection;
import java.security.MessageDigest;
import java.util.Arrays;
import javax.net.ssl.HttpsURLConnection;

/** Bound all network reads; original bytes are never recompressed. */
public final class PhotoIO {
    private PhotoIO() {}
    static void checkCancelled() throws InterruptedIOException {
        if (Thread.currentThread().isInterrupted()) throw new InterruptedIOException("Cancelled");
    }
    public static String verify(InputStream input, OutputStream output, PhotoRequest request) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] buffer = new byte[16384];
        ByteArrayOutputStream header = new ByteArrayOutputStream(12);
        long count = 0;
        for (int read; (read = input.read(buffer)) != -1;) {
            checkCancelled();
            count += read;
            if (count > request.bytes || count > PhotoRequest.MAX_BYTES) throw new IOException("Photo too large");
            if (header.size() < 12) header.write(buffer, 0, Math.min(read, 12 - header.size()));
            digest.update(buffer, 0, read);
            if (output != null) output.write(buffer, 0, read);
        }
        if (count != request.bytes || count < 12 || !matchesType(header.toByteArray(), request.mime)) throw new IOException("Incomplete or invalid photo");
        String actual = hex(digest.digest());
        if (!actual.equals(request.sha256)) throw new IOException("Photo checksum mismatch");
        return actual;
    }
    private static boolean matchesType(byte[] h, String mime) {
        if (mime.equals("image/jpeg")) return (h[0] & 255) == 255 && (h[1] & 255) == 216 && (h[2] & 255) == 255;
        if (mime.equals("image/png")) return Arrays.equals(Arrays.copyOf(h, 8), new byte[]{(byte)137,80,78,71,13,10,26,10});
        return h[0]=='R' && h[1]=='I' && h[2]=='F' && h[3]=='F' && h[8]=='W' && h[9]=='E' && h[10]=='B' && h[11]=='P';
    }
    private static String hex(byte[] data) {
        StringBuilder value = new StringBuilder();
        for (byte item : data) value.append(String.format(java.util.Locale.ROOT, "%02x", item & 255));
        return value.toString();
    }
    public static File receive(PhotoRequest request, File directory) throws Exception {
        checkCancelled();
        HttpURLConnection connection = (HttpURLConnection) request.source.toURL().openConnection();
        if (!(connection instanceof HttpsURLConnection)) throw new IOException("HTTPS required");
        connection.setInstanceFollowRedirects(false);
        connection.setConnectTimeout(15000); connection.setReadTimeout(60000);
        connection.setRequestProperty("Accept", request.mime);
        connection.setRequestProperty("Accept-Encoding", "identity");
        File temporary = null;
        boolean complete = false;
        try {
            if (connection.getResponseCode() != 200) throw new IOException("Photo unavailable");
            long length = connection.getContentLengthLong();
            if (length >= 0 && length != request.bytes) throw new IOException("Invalid content length");
            String mime = connection.getContentType();
            if (mime == null || !(mime.split(";")[0].trim().equalsIgnoreCase(request.mime) || mime.split(";")[0].trim().equals("application/octet-stream"))) throw new IOException("Invalid content type");
            temporary = File.createTempFile("DANZ-", ".photo", directory);
            try (InputStream input = connection.getInputStream(); OutputStream output = new FileOutputStream(temporary)) { verify(input, output, request); }
            complete = true;
            return temporary;
        } finally {
            connection.disconnect();
            if (!complete && temporary != null) temporary.delete();
        }
    }
}
