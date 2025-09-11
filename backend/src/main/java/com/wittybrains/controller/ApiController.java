package com.wittybrains.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;

import java.io.File;
import java.io.IOException;
import java.util.*;

@RestController
@RequestMapping("/api")
public class ApiController {

    @Value("${storage.dir:storage}")
    private String storageDir;

    // -------------------- INIT STORAGE --------------------
    @PostConstruct
    public void init() {
        File dir = new File(storageDir);
        if (!dir.exists()) {
            boolean created = dir.mkdirs();
            System.out.println("Storage directory created: " + created + " at " + dir.getAbsolutePath());
        } else {
            System.out.println("Storage directory already exists at " + dir.getAbsolutePath());
        }
    }

    // -------------------- HEALTH CHECK --------------------
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "timestamp", new Date().toString()));
    }

    // -------------------- LOGIN --------------------
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> creds) {
        String username = creds.get("username");
        String password = creds.get("password");

        if ("admin".equals(username) && "password".equals(password)) {
            return ResponseEntity.ok(Map.of(
                    "token", "fake-jwt-token-for-" + username,
                    "role", "ADMIN",
                    "username", username));
        } else if ("user".equals(username) && "password".equals(password)) {
            return ResponseEntity.ok(Map.of(
                    "token", "fake-jwt-token-for-" + username,
                    "role", "USER",
                    "username", username));
        }

        return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
    }

    // -------------------- CREATE FOLDER (ADMIN only) --------------------
    @PostMapping("/folders")
    public ResponseEntity<?> createFolder(@RequestHeader("role") String role,
                                          @RequestBody Map<String, String> req) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            return ResponseEntity.status(403).body(Map.of("error", "Only admin can create folders"));
        }

        String name = req.get("name");
        String parentPath = req.getOrDefault("parentPath", "");
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Folder name required"));
        }

        File folder = new File(storageDir, parentPath + File.separator + name);

        if (folder.exists()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Folder already exists"));
        }
        if (folder.mkdirs()) {
            return ResponseEntity.ok(Map.of(
                    "message", "Folder created",
                    "path", folder.getPath()));
        }
        return ResponseEntity.status(500).body(Map.of("error", "Failed to create folder"));
    }

    // -------------------- LIST FOLDERS/FILES --------------------
    @GetMapping("/folders")
    public ResponseEntity<?> listFolders(@RequestParam(defaultValue = "") String path,
                                         @RequestParam(required = false) String search) {
        File folder = new File(storageDir, path);
        if (!folder.exists() || !folder.isDirectory()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Folder not found"));
        }

        List<Map<String, Object>> items = new ArrayList<>();
        File[] files = folder.listFiles();
        if (files != null) {
            for (File f : files) {
                if (search != null && !f.getName().toLowerCase().contains(search.toLowerCase())) {
                    continue;
                }
                items.add(Map.of(
                        "name", f.getName(),
                        "type", f.isDirectory() ? "folder" : "file",
                        "updatedAt", new Date(f.lastModified())));
            }
        }

        return ResponseEntity.ok(items);
    }

    // -------------------- DELETE FOLDER/FILE (ADMIN only) --------------------
    @DeleteMapping("/folders")
    public ResponseEntity<?> deleteFolder(@RequestHeader("role") String role,
                                          @RequestParam String path) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            return ResponseEntity.status(403).body(Map.of("error", "Only admin can delete items"));
        }

        File folder = new File(storageDir, path);
        if (!folder.exists()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Item not found"));
        }

        boolean deleted = deleteRecursively(folder);
        if (deleted) {
            return ResponseEntity.ok(Map.of("message", "Item deleted"));
        }
        return ResponseEntity.status(500).body(Map.of("error", "Failed to delete item"));
    }

    // -------------------- UPLOAD FILE (ADMIN only) --------------------
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestHeader("role") String role,
                                        @RequestParam("file") MultipartFile file,
                                        @RequestParam(defaultValue = "") String path) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            return ResponseEntity.status(403).body(Map.of("error", "Only admin can upload files"));
        }

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
        }

        File destDir = new File(storageDir, path);
        if (!destDir.exists() && !destDir.mkdirs()) {
            return ResponseEntity.status(500).body(Map.of("error", "Could not create destination folder"));
        }

        File destFile = new File(destDir, file.getOriginalFilename());
        try {
            file.transferTo(destFile);
            return ResponseEntity.ok(Map.of(
                    "message", "File uploaded successfully",
                    "file", destFile.getAbsolutePath(),
                    "size", file.getSize()));
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Upload failed",
                    "details", e.getMessage()));
        }
    }

    // -------------------- DOWNLOAD FILE --------------------
    @GetMapping("/download")
    public ResponseEntity<?> downloadFile(@RequestParam String path) {
        File file = new File(storageDir, path);
        if (!file.exists() || !file.isFile()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File not found"));
        }
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + file.getName() + "\"")
                .body(file);
    }

    // -------------------- HELPER --------------------
    private boolean deleteRecursively(File file) {
        if (file.isDirectory()) {
            File[] children = file.listFiles();
            if (children != null) {
                for (File child : children) {
                    deleteRecursively(child);
                }
            }
        }
        return file.delete();
    }
}
