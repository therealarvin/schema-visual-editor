"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Project = {
  id: string;
  name: string;
  formType: string;
};

type ProjectsState = {
  projects: Project[];
  addProject: (project: Omit<Project, "id"> & { id?: string }) => string; // returns id
  renameProject: (id: string, name: string) => void;
  deleteProject: (id: string) => void;
  replaceAll: (projects: Project[]) => void;
};

function genId() {
  // Simple unique-ish id for local usage
  return Math.random().toString(36).slice(2, 10);
}

export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set) => ({
      projects: [],
      addProject: (project) => {
        const id = project.id ?? genId();
        set((state) => ({
          projects: [
            ...state.projects,
            { id, name: project.name, formType: project.formType },
          ],
        }));
        return id;
      },
      renameProject: (id, name) =>
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, name } : p)),
        })),
      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        })),
      replaceAll: (projects) => set({ projects }),
    }),
    {
      name: "psb_projects",
      version: 1,
      partialize: (state) => ({ projects: state.projects }),
      // migrate just in case future shapes change
      migrate: (persisted) => {
        if (!persisted) return { projects: [] };
        return persisted;
      },
    }
  )
);

