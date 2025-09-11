import React, { useEffect, useState } from "react";
import client from "./network";
import "./styles/dashboard.css";
import { Folder, File, ChevronRight } from "lucide-react";

function FolderRow({ f, onOpen, onDelete, onDownload, role }) {
  return (
    <tr>
      <td>
        {f.type === "folder" ? (
          <span className="icon-text">
            <Folder size={18} /> {f.name}
          </span>
        ) : (
          <span className="icon-text">
            <File size={18} /> {f.name}
          </span>
        )}
      </td>
      <td>{new Date(f.updatedAt).toLocaleString()}</td>
      <td>
        {f.type === "folder" ? (
          <button className="btn btn-open" onClick={() => onOpen(f)}>
            Open
          </button>
        ) : (
          <button className="btn btn-download" onClick={() => onDownload(f)}>
            Download
          </button>
        )}
      </td>
      <td>
        {role === "ADMIN" && (
          <button className="btn btn-delete" onClick={() => onDelete(f)}>
            Delete
          </button>
        )}
      </td>
    </tr>
  );
}

export default function Dashboard({ onLogout, role }) {
  const [items, setItems] = useState([]);
  const [parentPath, setParentPath] = useState("");
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [uploadFile, setUploadFile] = useState(null);

  // pagination states
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    load();
  }, [parentPath]);

  async function load() {
    const res = await client.get("/folders", { params: { path: parentPath } });
    setItems(res.data);
    setPage(1); // reset to first page when changing folder
  }

  async function createFolder(e) {
    e.preventDefault();
    if (!name) return;
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
    try {
      await client.delete("/folders", {
        params: { path: parentPath ? parentPath + "/" + f.name : f.name },
        headers: { role },
      });
      load();
    } catch (e) {
      alert(e.response?.data?.error || "Cannot delete");
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
    } catch (e) {
      alert("Download failed");
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!uploadFile) return;
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("path", parentPath);
    await client.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        role,
      },
    });
    setUploadFile(null);
    load();
  }

  function openFolder(f) {
    setParentPath(parentPath ? parentPath + "/" + f.name : f.name);
  }

  function goToBreadcrumb(index) {
    const parts = parentPath.split("/").filter(Boolean);
    const newPath = parts.slice(0, index + 1).join("/");
    setParentPath(newPath);
  }

  // search filter
  const filteredItems = items.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  // pagination logic
  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const paginatedItems = filteredItems.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h3>Dashboard - {role}</h3>
        <button className="btn btn-logout" onClick={onLogout}>
          Logout
        </button>
      </div>

      {/* breadcrumb */}
      <div className="breadcrumb">
        <span
          className="breadcrumb-item"
          onClick={() => setParentPath("")}
        >
          Root
        </span>
        {parentPath &&
          parentPath.split("/").map((p, i, arr) => (
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

      {role === "ADMIN" && (
        <div className="dashboard-actions">
          <form onSubmit={createFolder} className="form-inline">
            <input
              placeholder="Folder name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button type="submit" className="btn btn-create">
              Create
            </button>
          </form>

          <form onSubmit={handleUpload} className="form-inline">
            <input
              type="file"
              onChange={(e) => setUploadFile(e.target.files[0])}
            />
            <button type="submit" className="btn btn-upload">
              Upload
            </button>
          </form>
        </div>
      )}

      <div className="search-bar">
        <input
          placeholder="Search here..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Updated</th>
            <th>Action</th>
            {role === "ADMIN" && <th>Delete</th>} {/* ✅ Only show for admin */}
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

      {/* pagination */}
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
    </div>
  );
}
