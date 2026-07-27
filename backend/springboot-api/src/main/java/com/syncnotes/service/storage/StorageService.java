package com.syncnotes.service.storage;

import java.io.InputStream;

public interface StorageService {
    String storeFile(String key, InputStream inputStream, String mimeType, long sizeInBytes);
    InputStream getFile(String key);
    void deleteFile(String key);
    String generateSignedUrl(String key, long expirationMs);
}
