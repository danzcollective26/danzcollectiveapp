package com.danzcollective.photos;

import java.net.URI;
import java.net.URLDecoder;
import java.io.UnsupportedEncodingException;
import java.util.HashMap;
import java.util.Map;

/** All externally supplied input is validated before networking or writing. */
public final class PhotoRequest {
    public static final long MAX_BYTES = 25L * 1024 * 1024;
    public static final String STORAGE_HOST = "ttgehdknhnrxtddxpknc.supabase.co";
    public final URI source;
    public final String name, mime, sha256;
    public final long bytes;
    public final boolean story;

    private PhotoRequest(URI source, String name, String mime, String sha256, long bytes, boolean story) {
        this.source = source; this.name = name; this.mime = mime; this.sha256 = sha256; this.bytes = bytes; this.story = story;
    }
    public static PhotoRequest parse(String link) {
        if (link == null || link.length() > 14000) throw new IllegalArgumentException("Invalid request");
        URI uri = URI.create(link);
        if (!"danzphotos".equals(uri.getScheme()) || !"photo".equals(uri.getHost()) || uri.getPort() != -1 || uri.getUserInfo() != null || uri.getFragment() != null
                || !("/save".equals(uri.getRawPath()) || "/story".equals(uri.getRawPath()))) throw new IllegalArgumentException("Invalid action");
        Map<String, String> params = query(uri.getRawQuery());
        if (params.size() != 5) throw new IllegalArgumentException("Invalid parameters");
        String mime = required(params, "mime");
        if (!(mime.equals("image/jpeg") || mime.equals("image/png") || mime.equals("image/webp"))) throw new IllegalArgumentException("Invalid image type");
        long bytes = Long.parseLong(required(params, "bytes"));
        if (bytes < 1 || bytes > MAX_BYTES) throw new IllegalArgumentException("Invalid size");
        String sha256 = required(params, "sha256");
        if (!sha256.matches("[a-f0-9]{64}")) throw new IllegalArgumentException("Invalid checksum");
        String name = required(params, "name");
        String extension = mime.equals("image/jpeg") ? "(?:jpg|jpeg)" : mime.substring(6);
        if (name.length() > 160 || !name.matches("[A-Za-z0-9][A-Za-z0-9._ -]*\\." + extension)) throw new IllegalArgumentException("Invalid name");
        URI source = URI.create(required(params, "url"));
        if (!"https".equals(source.getScheme()) || !STORAGE_HOST.equals(source.getHost()) || source.getPort() != -1 || source.getUserInfo() != null || source.getFragment() != null
                || !source.getRawPath().matches("/storage/v1/object/sign/danz-event-photos/[A-Za-z0-9_-]+(?:/[A-Za-z0-9_.-]+)+")
                || source.getRawPath().contains("..")) throw new IllegalArgumentException("Invalid source");
        Map<String, String> sourceParams = query(source.getRawQuery());
        String token = required(sourceParams, "token");
        if (token.length() > 8192 || !token.matches("[A-Za-z0-9._~-]+")) throw new IllegalArgumentException("Invalid token");
        if (sourceParams.size() > 2 || sourceParams.size() == 2 && !sourceParams.containsKey("download")) throw new IllegalArgumentException("Unexpected source parameters");
        return new PhotoRequest(source, name, mime, sha256, bytes, "/story".equals(uri.getPath()));
    }
    private static String required(Map<String, String> values, String key) {
        String value = values.get(key);
        if (value == null || value.isEmpty()) throw new IllegalArgumentException("Missing parameter");
        return value;
    }
    private static String decode(String value) {
        try { return URLDecoder.decode(value, "UTF-8"); }
        catch (UnsupportedEncodingException impossible) { throw new AssertionError(impossible); }
    }
    private static Map<String, String> query(String raw) {
        if (raw == null || raw.length() > 13000) throw new IllegalArgumentException("Invalid query");
        Map<String, String> result = new HashMap<>();
        for (String part : raw.split("&", -1)) {
            String[] pair = part.split("=", 2);
            if (pair.length != 2) throw new IllegalArgumentException("Invalid query parameter");
            String key = decode(pair[0]);
            String value = decode(pair[1]);
            if (result.put(key, value) != null) throw new IllegalArgumentException("Repeated parameter");
        }
        return result;
    }
}
