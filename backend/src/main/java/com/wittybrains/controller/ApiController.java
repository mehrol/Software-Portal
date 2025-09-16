package com.wittybrains.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.DecimalFormat;
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

        if ("admin".equals(username) && "Witty$2026".equals(password)) {
            return ResponseEntity.ok(Map.of(
                    "token", "fake-jwt-token-for-" + username,
                    "role", "ADMIN",
                    "username", username));
        } else if ("user".equals(username) && "mypass123".equals(password)) {
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
        String safePath = normalizePath(path);
        File folder = new File(storageDir, safePath);
        if (!folder.exists() || !folder.isDirectory()) {
            // Auto-create root directory if missing
            if (safePath.isBlank()) {
                boolean created = folder.mkdirs();
                if (!created) {
                    return ResponseEntity.status(500).body(Map.of("error", "Failed to initialize root folder"));
                }
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Folder not found"));
            }
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
                        "updatedAt", new Date(f.lastModified()),
                        "size", f.isDirectory() ? "" : formatBytes(f.length())
                ));
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

        String safePath = normalizePath(path);
        File folder = new File(storageDir, safePath);
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

        String safePath = normalizePath(path);
        File destDir = new File(storageDir, safePath);
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

    // -------------------- UPLOAD FROM URL (ADMIN only) --------------------
    @PostMapping("/uploadUrl")
    public ResponseEntity<?> uploadFileFromUrl(@RequestHeader("role") String role,
                                               @RequestParam("url") String fileUrl,
                                               @RequestParam(defaultValue = "") String path) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            return ResponseEntity.status(403).body(Map.of("error", "Only admin can upload files"));
        }

        try {
            URL url = new URL(fileUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("HEAD");
            conn.connect();

            int responseCode = conn.getResponseCode();
            if (responseCode >= 400) {
                return ResponseEntity.badRequest().body(Map.of("error", "URL is not downloadable"));
            }

            String fileName = new File(url.getPath()).getName();
            if (fileName.isBlank()) {
                fileName = "downloaded_" + System.currentTimeMillis();
            }

            String safePath = normalizePath(path);
            File destDir = new File(storageDir, safePath);
            if (!destDir.exists() && !destDir.mkdirs()) {
                return ResponseEntity.status(500).body(Map.of("error", "Could not create destination folder"));
            }

            File destFile = new File(destDir, fileName);

            try (InputStream in = url.openStream();
                 FileOutputStream out = new FileOutputStream(destFile)) {
                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = in.read(buffer)) != -1) {
                    out.write(buffer, 0, bytesRead);
                }
            }

            return ResponseEntity.ok(Map.of(
                    "message", "File downloaded successfully",
                    "file", destFile.getAbsolutePath(),
                    "size", formatBytes(destFile.length())));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Failed to download file from URL",
                    "details", e.getMessage()));
        }
    }

    // -------------------- DOWNLOAD FILE --------------------
    @GetMapping("/download")
    public ResponseEntity<?> downloadFile(@RequestParam String path) {
        String safePath = normalizePath(path);
        File file = new File(storageDir, safePath);
        if (!file.exists() || !file.isFile()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File not found"));
        }
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + file.getName() + "\"")
                .body(file);
    }

    // -------------------- HELPER --------------------
    private String normalizePath(String inputPath) {
        if (inputPath == null || inputPath.isBlank() || "null".equalsIgnoreCase(inputPath) || ".".equals(inputPath)) {
            return "";
        }
        String normalized = inputPath.replace('\\', '/');
        if (normalized.contains(":")) { // prevent Windows drive absolute paths like C:/
            return "";
        }
        while (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }
        if (normalized.contains("..")) {
            // prevent path traversal
            return "";
        }
        return normalized;
    }

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

    private String formatBytes(long bytes) {
        if (bytes == 0) {
            return "0 Bytes";
        }
        final int k = 1024;
        final String[] sizes = {"Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"};
        final int i = (int) Math.floor(Math.log(bytes) / Math.log(k));
        DecimalFormat df = new DecimalFormat("#.##");
        return df.format(bytes / Math.pow(k, i)) + " " + sizes[i];
    }
}
