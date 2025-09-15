import React, { useEffect, useState, useRef } from "react";
import client from "./network";
import "./styles/dashboard.css";
import "./utils/fileIcons";
import { Folder, File, ChevronRight, Search, UploadCloud } from "lucide-react";

function FolderRow({ f, onOpen, onDelete, onDownload, role }) {
  return (
    <tr className={f.type === "folder" ? "row-folder" : "row-file"}>
      {/* Name column */}
      <td className="file-cell">
        {f.type === "folder" ? (
          <>
            <Folder
              size={18}
              className="clickable"
              onClick={() => onOpen(f)}
            />
            <span
              className="file-name clickable"
              onClick={() => onOpen(f)}
            >
              {f.name}
            </span>
          </>
        ) : (
          <>
            <File size={18} />
            <span
              className="file-name file-link"
              onClick={() => onDownload(f)}
            >
              {f.name}
            </span>
          </>
        )}
      </td>

      {/* Type */}
      <td className="type-cell">{f.type === "folder" ? "Folder" : "File"}</td>

      {/* Updated */}
      <td>{new Date(f.updatedAt).toLocaleString()}</td>

      {/* Delete */}
      {role === "ADMIN" && (
        <td>
          <button
            className="btn btn-delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(f);
            }}
          >
            Delete
          </button>
        </td>
      )}
    </tr>
  );
}

export default function Dashboard({ onLogout, role }) {
  const [items, setItems] = useState([]);
  const [parentPath, setParentPath] = useState("");
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    load();
  }, [parentPath]);

  async function load() {
    const res = await client.get("/folders", { params: { path: parentPath } });
    setItems(res.data);
    setPage(1);
  }

  async function createFolder(e) {
    e.preventDefault();
    if (!name) return;

    const exists = items.some(
      (f) => f.type === "folder" && f.name.toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      alert("⚠️ Folder already exists in this directory");
      return;
    }

    await client.post(
      "/folders",
      { name, parentPath },
      { headers: { role } }
    );
    setName("");
    load();
  }

  async function deleteItem(f) {
    if (!window.confirm("Delete this item?")) return;
    await client.delete("/folders", {
      params: { path: parentPath ? parentPath + "/" + f.name : f.name },
      headers: { role },
    });
    load();
  }

  async function downloadFile(f) {
    try {
      const res = await client.get(`/download`, {
        params: { path: parentPath ? parentPath + "/" + f.name : f.name },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", f.name);
      document.body.appendChild(link);
      link.click();
    } catch {
      alert("Download failed");
    }
  }

  async function handleFileChangeAndUpload(e) {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    const exists = items.some(
      (f) => f.type === "file" && f.name.toLowerCase() === file.name.toLowerCase()
    );
    if (exists) {
      alert("⚠️ File already exists in this directory");
      // Reset the file input to allow re-selection of the same file
      e.target.value = null;
      return;
    }
    
    setUploadFile(file);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", parentPath);

    try {
      setIsUploading(true);
      await client.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data", role },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percent);
        },
      });
      setUploadFile(null);
      setUploadProgress(0);
      setIsUploading(false);
      load();
    } catch {
      alert("Upload failed");
      setUploadFile(null);
      setUploadProgress(0);
      setIsUploading(false);
    }
    // Reset the file input to allow re-selection
    e.target.value = null;
  }

  function openFolder(f) {
    setParentPath(parentPath ? parentPath + "/" + f.name : f.name);
  }

  function goToBreadcrumb(index) {
    const parts = parentPath.split("/").filter(Boolean);
    const newPath = parts.slice(0, index + 1).join("/");
    setParentPath(newPath);
  }

  const filteredItems = items.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const paginatedItems = filteredItems.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h3>Dashboard - {role}</h3>
        <button className="btn btn-logout" onClick={onLogout}>
          Logout
        </button>
      </div>

      {/* Controls */}
      <div className="dashboard-controls">
        <div className="control-group">
          {role === "ADMIN" && (
            <>
              {/* Create Folder */}
              <form onSubmit={createFolder} className="control-group">
                <input
                  type="text"
                  placeholder="Folder name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <button type="submit" className="btn btn-create">
                  Create
                </button>
              </form>
              
              {/* Upload Icon Button */}
              <div className="upload-group">
                <button
                  type="button"
                  className="btn btn-upload-icon"
                  onClick={() => fileInputRef.current.click()}
                >
                  <UploadCloud size={16} />
                </button>
                <input
                  type="file"
                  hidden
                  ref={fileInputRef}
                  onChange={handleFileChangeAndUpload}
                />
              </div>
            </>
          )}
        </div>

        {/* Search */}
        <div className="control-group">
          <input
            type="text"
            placeholder="Search here..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="btn btn-search"
            onClick={() => setSearchQuery(search)}
          >
            <Search size={16} />
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span className="breadcrumb-item" onClick={() => setParentPath("")}>
          Root
        </span>
        {parentPath &&
          parentPath.split("/").map((p, i) => (
            <span key={i} className="breadcrumb-segment">
              <ChevronRight size={14} />
              <span
                className="breadcrumb-item"
                onClick={() => goToBreadcrumb(i)}
              >
                {p}
              </span>
            </span>
          ))}
      </div>

      {/* Table */}
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Updated</th>
            {role === "ADMIN" && <th>Delete</th>}
          </tr>
        </thead>
        <tbody>
          {paginatedItems.map((f) => (
            <FolderRow
              key={f.name}
              f={f}
              role={role}
              onOpen={openFolder}
              onDelete={deleteItem}
              onDownload={downloadFile}
            />
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-page"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-page"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Upload Progress Box */}
      {isUploading && (
        <div className="upload-overlay">
          <div className="upload-box">
            <h4>Uploading...</h4>
            {uploadFile && <p>{uploadFile.name}</p>}
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              >
                {uploadProgress}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}