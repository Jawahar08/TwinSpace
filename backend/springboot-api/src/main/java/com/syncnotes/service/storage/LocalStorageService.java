package com.syncnotes.service.storage;

import com.syncnotes.exception.SyncNotesException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
@Slf4j
public class LocalStorageService implements StorageService {

    private final Path rootLocation;

    public LocalStorageService(@Value("${storage.local-dir:./uploads}") String uploadDir) {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootLocation);
        } catch (Exception e) {
            log.error("Could not initialize local storage directory", e);
        }
    }

    @Override
    public String storeFile(String key, InputStream inputStream, String mimeType, long sizeInBytes) {
        try {
            Path destinationFile = this.rootLocation.resolve(Paths.get(key)).normalize().toAbsolutePath();
            if (!destinationFile.getParent().startsWith(this.rootLocation)) {
                throw new SyncNotesException("SECURITY_ERROR", "Cannot store file outside target directory", HttpStatus.BAD_REQUEST);
            }
            Files.createDirectories(destinationFile.getParent());
            try (FileOutputStream fos = new FileOutputStream(destinationFile.toFile())) {
                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    fos.write(buffer, 0, bytesRead);
                }
            }
            return key;
        } catch (Exception e) {
            log.error("Error storing file: {}", key, e);
            throw new SyncNotesException("STORAGE_ERROR", "Failed to store file: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public InputStream getFile(String key) {
        try {
            Path file = this.rootLocation.resolve(Paths.get(key)).normalize();
            if (!Files.exists(file)) {
                throw new SyncNotesException("FILE_NOT_FOUND", "File not found: " + key, HttpStatus.NOT_FOUND);
            }
            return new FileInputStream(file.toFile());
        } catch (Exception e) {
            throw new SyncNotesException("STORAGE_ERROR", "Failed to read file: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public void deleteFile(String key) {
        try {
            Path file = this.rootLocation.resolve(Paths.get(key)).normalize();
            Files.deleteIfExists(file);
        } catch (Exception e) {
            log.warn("Failed to delete file: {}", key, e);
        }
    }

    @Override
    public String generateSignedUrl(String key, long expirationMs) {
        // In local storage mode, return direct authenticated endpoint URL
        return "/api/attachments/download/" + key;
    }
}
