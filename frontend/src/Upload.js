// import React, { useState } from "react";
// import client from "./network"; // axios instance pointing to backend

// export default function Upload() {
//   const [file, setFile] = useState(null);
//   const [path, setPath] = useState("");
//   const [message, setMessage] = useState("");

//   const handleFileChange = (e) => setFile(e.target.files[0]);

//   const handleUpload = async (e) => {
//     e.preventDefault();
//     if (!file) {
//       setMessage("Please select a file");
//       return;
//     }

//     const formData = new FormData();
//     formData.append("file", file);
//     formData.append("path", path); // folder path in backend storage

//     try {
//       const res = await client.post("/upload", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       setMessage(`Upload successful: ${res.data.file}`);
//     } catch (err) {
//       setMessage(`Upload failed: ${err.response?.data?.error || err.message}`);
//     }
//   };

//   return (
//     <div style={{ maxWidth: 500, margin: "2rem auto", padding: 20, border: "1px solid #ccc", borderRadius: 8 }}>
//       <h3>Upload File</h3>
//       <form onSubmit={handleUpload}>
//         <div style={{ marginBottom: 10 }}>
//           <label>Folder Path (relative to storage): </label>
//           <input
//             type="text"
//             value={path}
//             onChange={(e) => setPath(e.target.value)}
//             placeholder="e.g., test12"
//             style={{ width: "100%", padding: 6 }}
//           />
//         </div>
//         <div style={{ marginBottom: 10 }}>
//           <input type="file" onChange={handleFileChange} />
//         </div>
//         <button type="submit" style={{ padding: "6px 12px" }}>
//           Upload
//         </button>
//       </form>
//       {message && <p style={{ marginTop: 10, color: "green" }}>{message}</p>}
//     </div>
//   );
// }
