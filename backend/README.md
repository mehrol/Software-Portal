Wittybrains Backend (Spring Boot)
Java: 17 (LTS)
Spring Boot: 3.1.x
Features:
- Simple token-based auth (in-memory). Two users: admin/admin123 and user/user123
- Folder entity stored in H2 DB
- Files stored on filesystem under 'storage' directory
- Endpoints:
  POST /api/auth/login -> { username, password }
  POST /api/folders -> create folder (admin only)
  GET /api/folders -> list folders (supports parentId,page,size)
  DELETE /api/folders/{id} -> delete folder (admin; only if empty)
  POST /api/upload -> upload file (admin only) params: folderId, file(multipart)
  GET /api/download/{folderId}/{filename} -> download file
Run:
mvn spring-boot:run
Notes:
- Tokens generated at login must be sent as Authorization: Bearer <token>
- For production use switch to PostgreSQL and implement JWT instead of in-memory tokens.
