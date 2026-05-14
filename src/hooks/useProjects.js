import { useState } from 'react';

export default function useProjects() {
  const [projects, setProjects] = useState([]);

  const fetchProjects = async () => {
    const response = await fetch('/api/projects');
    const data = await response.json();
    setProjects(data.projects);
  };

  const createProject = async (project) => {
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    fetchProjects();
  };

  const deleteProject = async (projectId) => {
    await fetch(`/api/projects?id=${projectId}`, {
      method: 'DELETE',
    });
    fetchProjects();
  };

  return { projects, fetchProjects, createProject, deleteProject };
}