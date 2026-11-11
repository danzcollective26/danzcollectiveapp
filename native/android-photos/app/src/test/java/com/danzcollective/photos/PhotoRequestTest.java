package com.danzcollective.photos;
import org.junit.Test;
import static org.junit.Assert.*;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.io.*;
import java.security.MessageDigest;

public class PhotoRequestTest {
    private static final byte[] PHOTO = new byte[]{(byte)255,(byte)216,(byte)255,1,2,3,4,5,6,7,8,9,10,11};
    private static String digest() throws Exception {
        StringBuilder result=new StringBuilder();
        for(byte b:MessageDigest.getInstance("SHA-256").digest(PHOTO))result.append(String.format("%02x",b&255));
        return result.toString();
    }
    private static String link(String source) throws Exception {
        return "danzphotos://photo/save?url="+URLEncoder.encode(source,"UTF-8")+"&name=DANZ-original.jpg&mime=image%2Fjpeg&bytes="+PHOTO.length+"&sha256="+digest();
    }
    private static final String SOURCE="https://ttgehdknhnrxtddxpknc.supabase.co/storage/v1/object/sign/danz-event-photos/event/photo/original.jpg?token=synthetic-token&download=DANZ-original.jpg";
    @Test public void acceptsOnlyBoundNamedPhotoAndPreservesBytes() throws Exception {
        PhotoRequest request=PhotoRequest.parse(link(SOURCE));
        assertEquals(SOURCE,request.source.toString());assertFalse(request.story);
        ByteArrayOutputStream out=new ByteArrayOutputStream();
        assertEquals(digest(),PhotoIO.verify(new ByteArrayInputStream(PHOTO),out,request));assertArrayEquals(PHOTO,out.toByteArray());
    }
    @Test public void rejectsOtherOriginsProtocolsRedirectInputsAndDuplicateParameters() throws Exception {
        for(String source:new String[]{SOURCE.replace("https:","http:"),SOURCE.replace("ttgehdknhnrxtddxpknc.supabase.co","example.invalid"),SOURCE.replace("https://","https://user:password@"),SOURCE.replace("/event/photo/","/event/../"),SOURCE.replace("/event/photo/","/event%2Fphoto/"),SOURCE+"&redirect=https%3A%2F%2Fexample.invalid",SOURCE+"&token=other"}) {
            try {PhotoRequest.parse(link(source));fail("Accepted untrusted source");}catch(IllegalArgumentException expected){}
        }
        try{PhotoRequest.parse(link(SOURCE)+"&name=other.jpg");fail();}catch(IllegalArgumentException expected){}
    }
    @Test public void refusesZeroBytesChangedContentAndOversizeBeforeSuccess() throws Exception {
        PhotoRequest request=PhotoRequest.parse(link(SOURCE));
        for(byte[] data:new byte[][]{new byte[0],new byte[PHOTO.length+1],new byte[PHOTO.length]}) {
            try{PhotoIO.verify(new ByteArrayInputStream(data),null,request);fail();}catch(IOException expected){}
        }
        try{PhotoRequest.parse(link(SOURCE).replace("bytes=14","bytes=0"));fail();}catch(IllegalArgumentException expected){}
        try{PhotoRequest.parse(link(SOURCE).replace("bytes=14","bytes=999999999"));fail();}catch(IllegalArgumentException expected){}
    }
}
