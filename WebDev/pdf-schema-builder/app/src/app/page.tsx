"use client";
import { useProjectsStore, type Project } from "@/stores/projects";
import { useState } from "react";

export default function Home() {
  const projects = useProjectsStore((s) => s.projects);
  const addProject = useProjectsStore((s) => s.addProject);
  const renameProject = useProjectsStore((s) => s.renameProject);
  const deleteProject = useProjectsStore((s) => s.deleteProject);

  const [newName, setNewName] = useState("");
  const [newFormType, setNewFormType] = useState("");

  const create = () => {
    const name = newName.trim() || `Project ${projects.length + 1}`;
    const formType = newFormType.trim() || "default";
    addProject({ name, formType });
    setNewName("");
    setNewFormType("");
  };

  const onOpen = (p: Project) => {
    // navigate to project page
    if (typeof window !== "undefined") {
      window.location.href = `/${p.id}`;
    }
  };

  const onRename = (p: Project) => {
    const name = prompt("Rename project", p.name);
    if (name && name.trim()) renameProject(p.id, name.trim());
  };

  const onDelete = (p: Project) => {
    if (confirm(`Delete project "${p.name}"?`)) deleteProject(p.id);
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
        Projects
      </h1>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 16,
          alignItems: "center",
        }}
      >
        <input
          placeholder="Project name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
        />
        <input
          placeholder="Form type"
          value={newFormType}
          onChange={(e) => setNewFormType(e.target.value)}
          style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
        />
        <button onClick={create} style={{ padding: "8px 12px" }}>
          Create
        </button>
      </div>

      {projects.length === 0 ? (
        <p>No projects yet. Create one above.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {projects.map((p) => (
            <li
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid #e5e5e5",
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div style={{ color: "#666", fontSize: 12 }}>formType: {p.formType}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => onOpen(p)}>Open</button>
                <button onClick={() => onRename(p)}>Rename</button>
                <button onClick={() => onDelete(p)} style={{ color: "#b00" }}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
