'use client';

import SidebarSectionItem, { SidebarSection } from './SidebarSectionItem';

type SubjectTree = {
  id: number;
  title: string;
  sections: SidebarSection[];
};

type SubjectSidebarProps = {
  subjectId: string;
  tree: SubjectTree | null;
  activeVideoId: number | null;
  loading?: boolean;
  error?: string | null;
};

export default function SubjectSidebar({ subjectId, tree, activeVideoId, loading, error }: SubjectSidebarProps) {
  return (
    <aside className="h-screen w-full max-w-sm shrink-0 overflow-y-auto border-r border-zinc-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-zinc-900">{tree?.title ?? 'Subject'}</h2>

      {loading ? <p className="mt-4 text-sm text-zinc-500">Loading sections...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 space-y-2">
        {tree?.sections.map((section) => (
          <SidebarSectionItem
            key={section.id}
            section={section}
            subjectId={subjectId}
            activeVideoId={activeVideoId}
          />
        ))}
      </div>
    </aside>
  );
}
