'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';

type SubjectPageProps = {
  params: {
    subjectId: string;
  };
};

export default function SubjectRootPage({ params }: SubjectPageProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const redirectToFirstVideo = async () => {
      try {
        const response = await apiClient.get(`/api/subjects/${params.subjectId}/first-video`);
        const videoId = response.data?.video_id as number | undefined;

        if (!videoId) {
          throw new Error('Missing video id');
        }

        if (!cancelled) {
          router.replace(`/subjects/${params.subjectId}/video/${videoId}`);
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load first unlocked video.');
        }
      }
    };

    void redirectToFirstVideo();

    return () => {
      cancelled = true;
    };
  }, [params.subjectId, router]);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return <p className="text-sm text-zinc-600">Loading...</p>;
}
