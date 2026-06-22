interface RecentProject {
  path: string
}

export function selectDefaultProjectPath(lastProject: string | null, recentProjects: RecentProject[]): string | null {
  if (lastProject?.trim()) return lastProject
  return recentProjects[0]?.path ?? null
}
