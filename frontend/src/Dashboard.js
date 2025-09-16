import React, { useEffect, useState, useRef } from "react";
import client from "./network";
import "./styles/dashboard.css";
import "./utils/fileIcons";
import {
  Folder,
  File,
  ChevronRight,
  UploadCloud,
  ArrowUp,
  ArrowDown,
  Link as LinkIcon,
} from "lucide-react";

// ------------------- Create Folder Modal -------------------
function CreateFolderModal({ isVisible, onClose, onCreateFolder, items }) {
  const [folderName, setFolderName] = useState("");

  if (!isVisible) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!folderName.trim()) {
      alert("Folder name cannot be empty.");
      return;
    }
    const exists = items.some(
      (f) => f.type === "folder" && f.name.toLowerCase() === folderName.toLowerCase()
    );
    if (exists) {
      onCreateFolder(folderName, true); // already exists
    } else {
      onCreateFolder(folderName, false);
    }
    setFolderName("");
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Create New Folder</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Enter folder name"
            required
            autoFocus
          />
          <div className="modal-actions">
            <button type="button" className="btn btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-create">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ------------------- Upload Link Modal -------------------
function UploadLinkModal({ isVisible, onClose, onUploadLink }) {
  const [url, setUrl] = useState("");

  if (!isVisible) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) {
      alert("URL cannot be empty.");
      return;
    }
    await onUploadLink(url);
    setUrl("");
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Upload File from Link</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste file URL here"
            required
            autoFocus
          />
          <div className="modal-actions">
            <button type="button" className="btn btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-create">
              Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ------------------- Table Row -------------------
function FolderRow({ f, onOpen, onDelete, onDownload, role }) {
  return (
    <tr className={f.type === "folder" ? "row-folder" : "row-file"}>
      <td className="file-cell">
        {f.type === "folder" ? (
          <>
            <Folder size={18} className="clickable" onClick={() => onOpen(f)} />
            <span className="file-name clickable" onClick={() => onOpen(f)}>
              {f.name}
            </span>
          </>
        ) : (
          <>
            <File size={18} />
            <span className="file-name file-link" onClick={() => onDownload(f)}>
              {f.name}
            </span>
          </>
        )}
      </td>
      <td className="type-cell">{f.type === "folder" ? "Folder" : "File"}</td>
      <td>{new Date(f.updatedAt).toLocaleString()}</td>
      <td>{f.type === "file" ? f.size : "--"}</td>
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

// ------------------- Main Dashboard -------------------
export default function Dashboard({ onLogout, role }) {
  const [items, setItems] = useState([]);
  const [parentPath, setParentPath] = useState("");
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "ascending" });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadLinkModal, setShowUploadLinkModal] = useState(false);

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

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
  };

  async function createFolder(folderName, alreadyExists) {
    setShowCreateModal(false);
    if (alreadyExists) {
      showNotification("Folder already exists!", "error");
      return;
    }
    try {
      await client.post(
        "/folders",
        { name: folderName, parentPath },
        { headers: { role } }
      );
      load();
      showNotification("Folder created successfully!", "success");
    } catch {
      showNotification("Failed to create folder.", "error");
    }
  }

  async function deleteItem(f) {
    if (!window.confirm("Delete this item?")) return;
    try {
      await client.delete("/folders", {
        params: { path: parentPath ? parentPath + "/" + f.name : f.name },
        headers: { role },
      });
      load();
      showNotification("Item deleted successfully!", "success");
    } catch {
      showNotification("Deletion failed.", "error");
    }
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
    if (!file) return;

    const exists = items.some(
      (f) => f.type === "file" && f.name.toLowerCase() === file.name.toLowerCase()
    );
    if (exists) {
      alert("⚠️ File already exists in this directory");
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
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
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
    e.target.value = null;
  }

  async function handleUploadLink(url) {
    try {
      await client.post("/uploadUrl", null, {
        params: { url, path: parentPath },
        headers: { role },
      });
      load();
      showNotification("File uploaded from link!", "success");
    } catch {
      showNotification("Failed to upload from link.", "error");
    }
  }

  function openFolder(f) {
    setParentPath(parentPath ? parentPath + "/" + f.name : f.name);
  }

  function goToBreadcrumb(index) {
    const parts = parentPath.split("/").filter(Boolean);
    const newPath = parts.slice(0, index + 1).join("/");
    setParentPath(newPath);
  }

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const sortedItems = [...items].sort((a, b) => {
    if (a.type === "folder" && b.type !== "folder") return -1;
    if (a.type !== "folder" && b.type === "folder") return 1;

    const aValue =
      sortConfig.key === "name" ? a.name.toLowerCase() : new Date(a.updatedAt);
    const bValue =
      sortConfig.key === "name" ? b.name.toLowerCase() : new Date(b.updatedAt);

    if (aValue < bValue) {
      return sortConfig.direction === "ascending" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === "ascending" ? 1 : -1;
    }
    return 0;
  });

  const filteredItems = sortedItems.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === "ascending" ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

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
              {/* Create Folder Button */}
              <div className="control-group">
                <button
                  type="button"
                  className="btn btn-create"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create New Folder
                </button>
              </div>

              {/* Upload File Button */}
              <div className="upload-group">
                <button
                  type="button"
                  className="btn btn-upload-icon"
                  onClick={() => fileInputRef.current.click()}
                  title="Upload File"
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

              {/* Upload Link Button */}
              <div className="upload-group">
                <button
                  type="button"
                  className="btn btn-upload-icon"
                  onClick={() => setShowUploadLinkModal(true)}
                  title="Upload from Link"
                >
                  <LinkIcon size={16} />
                </button>
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
            onChange={(e) => {
              setSearch(e.target.value);
              setSearchQuery(e.target.value);
            }}
          />
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
              <span className="breadcrumb-item" onClick={() => goToBreadcrumb(i)}>
                {p}
              </span>
            </span>
          ))}
      </div>

      {/* Table */}
      <table className="data-table">
        <thead>
          <tr>
            <th onClick={() => handleSort("name")} className="sortable">
              Name <SortIcon columnKey="name" />
            </th>
            <th>Type</th>
            <th onClick={() => handleSort("updatedAt")} className="sortable">
              Modified <SortIcon columnKey="updatedAt" />
            </th>
            <th>Size</th>
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
              <div className="progress-fill" style={{ width: `${uploadProgress}%` }}>
                {uploadProgress}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Popup */}
      {notification.show && (
        <div className={`notification-popup ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Modals */}
      <CreateFolderModal
        isVisible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateFolder={createFolder}
        items={items}
      />

      <UploadLinkModal
        isVisible={showUploadLinkModal}
        onClose={() => setShowUploadLinkModal(false)}
        onUploadLink={handleUploadLink}
      />
    </div>
  );
}
