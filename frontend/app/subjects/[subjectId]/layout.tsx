'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import SubjectSidebar from '@/components/Sidebar/SubjectSidebar';
import { apiClient } from '@/lib/apiClient';

type TreeVideo = {
  id: number;
  title: string;
  order_index: number;
  is_completed: boolean;
  locked: boolean;
};

type TreeSection = {
  id: number;
  title: string;
  order_index: number;
  videos: TreeVideo[];
};

type SubjectTree = {
  id: number;
  title: string;
  sections: TreeSection[];
};

type SubjectLayoutProps = {
  children: React.ReactNode;
  params: {
    subjectId: string;
  };
};

export default function SubjectLayout({ children, params }: SubjectLayoutProps) {
  const pathname = usePathname();

  const [tree, setTree] = useState<SubjectTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadTree = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get(`/api/subjects/${params.subjectId}/tree`);
        if (!cancelled) {
          setTree(response.data as SubjectTree);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load subject tree');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadTree();

    return () => {
      cancelled = true;
    };
  }, [params.subjectId]);

  const activeVideoId = useMemo(() => {
    const match = pathname.match(/\/video\/(\d+)/);
    return match ? Number.parseInt(match[1], 10) : null;
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <SubjectSidebar
        subjectId={params.subjectId}
        tree={tree}
        activeVideoId={activeVideoId}
        loading={loading}
        error={error}
      />

      <section className="flex-1 overflow-y-auto p-4 md:p-6">{children}</section>
    </div>
  );
}
