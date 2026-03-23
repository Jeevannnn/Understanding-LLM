'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import YouTube, { YouTubeEvent } from 'react-youtube';
import VideoProgressBar from '@/components/Sidebar/VideoProgressBar';
import { apiClient } from '@/lib/apiClient';
import { useProgressStore } from '@/lib/progress';

type PlayerRef = {
  getCurrentTime: () => number;
  getDuration: () => number;
};

type VideoDetail = {
  id: number;
  title: string;
  description: string;
  youtube_url: string;
  order_index: number;
  duration_seconds: number | null;
  section_id: number;
  section_title: string;
  subject_id: number;
  subject_title: string;
  previous_video_id: number | null;
  next_video_id: number | null;
  locked: boolean;
  unlock_reason: string | null;
};

type VideoProgressResponse = {
  last_position_seconds: number;
  is_completed: boolean;
};

type VideoPageProps = {
  params: {
    subjectId: string;
    videoId: string;
  };
};

const PLAYING = 1;
const PAUSED = 2;
const ENDED = 0;

const extractYoutubeVideoId = (url: string): string | null => {
  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.toLowerCase();

    if (host.includes('youtu.be')) {
      return parsedUrl.pathname.replace('/', '') || null;
    }

    if (host.includes('youtube.com')) {
      const v = parsedUrl.searchParams.get('v');
      if (v) {
        return v;
      }

      const pathMatch = parsedUrl.pathname.match(/\/embed\/([^/?]+)/);
      return pathMatch ? pathMatch[1] : null;
    }

    return null;
  } catch {
    return null;
  }
};

export default function VideoLearningPage({ params }: VideoPageProps) {
  const router = useRouter();
  const playerRef = useRef<PlayerRef | null>(null);
  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [progress, setProgress] = useState<VideoProgressResponse>({
    last_position_seconds: 0,
    is_completed: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const markVideoCompleted = useProgressStore((state) => state.markVideoCompleted);
  const isCompleted = useProgressStore((state) => state.isCompleted);

  const stopSaving = () => {
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = null;
    }
  };

  useEffect(() => {
    useProgressStore.setState({
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      isCompleted: false,
      completionTick: 0,
      nextVideoId: null,
      prevVideoId: null,
    });

    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [videoResponse, progressResponse] = await Promise.all([
          apiClient.get(`/api/videos/${params.videoId}`),
          apiClient.get(`/api/progress/videos/${params.videoId}`),
        ]);

        if (cancelled) {
          return;
        }

        const videoData = videoResponse.data as VideoDetail;
        const progressData = progressResponse.data as VideoProgressResponse;

        setVideo(videoData);
        setProgress(progressData);

        useProgressStore.setState({
          currentTime: Math.max(0, progressData.last_position_seconds),
          duration: videoData.duration_seconds ?? 0,
          isPlaying: false,
          isCompleted: progressData.is_completed,
          nextVideoId: videoData.next_video_id,
          prevVideoId: videoData.previous_video_id,
        });
      } catch {
        if (!cancelled) {
          setError('Failed to load video');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
      stopSaving();
    };
  }, [params.videoId]);

  const youtubeVideoId = useMemo(() => {
    if (!video) {
      return null;
    }

    return extractYoutubeVideoId(video.youtube_url);
  }, [video]);

  const startSeconds = Math.max(0, progress.last_position_seconds - 3);

  const saveProgress = async (isVideoCompleted = false) => {
    if (!playerRef.current) {
      return;
    }

    const currentTime = Math.floor(playerRef.current.getCurrentTime());
    const duration = Math.floor(playerRef.current.getDuration());

    const payload = isVideoCompleted
      ? { last_position_seconds: duration, is_completed: true }
      : { last_position_seconds: Math.max(0, currentTime) };

    await apiClient.post(`/api/progress/videos/${params.videoId}`, payload);
  };

  const handleReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
  };

  const handleStateChange = async (event: YouTubeEvent<number>) => {
    const state = event.data;

    if (state === PLAYING) {
      useProgressStore.setState({ isPlaying: true });

      if (!saveIntervalRef.current) {
        saveIntervalRef.current = setInterval(() => {
          void saveProgress(false);
        }, 10000);
      }
    }

    if (state === PAUSED) {
      useProgressStore.setState({ isPlaying: false });
      stopSaving();
      await saveProgress(false);
    }

    if (state === ENDED) {
      useProgressStore.setState({ isPlaying: false });
      stopSaving();

      await saveProgress(true);
      markVideoCompleted(Number(params.videoId));

      if (video?.next_video_id) {
        router.push(`/subjects/${params.subjectId}/video/${video.next_video_id}`);
      }
    }
  };

  if (loading) {
    return <p className="text-sm text-zinc-600">Loading video...</p>;
  }

  if (error || !video) {
    return <p className="text-sm text-red-600">{error ?? 'Unable to load video.'}</p>;
  }

  const completed = progress.is_completed || isCompleted;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4">
      <VideoProgressBar subjectId={params.subjectId} />

      <header>
        <p className="text-sm text-zinc-500">{video.subject_title}</p>
        <h1 className="text-2xl font-semibold text-zinc-900">{video.title}</h1>
        <p className="mt-1 text-sm text-zinc-600">{video.description}</p>
      </header>

      {completed ? (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Completed. Great work!
        </div>
      ) : null}

      {video.locked ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900">🔒 This video is locked</h2>
          <p className="mt-2 text-sm text-zinc-600">{video.unlock_reason ?? 'Complete prerequisite lessons first.'}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-black">
          {youtubeVideoId ? (
            <YouTube
              videoId={youtubeVideoId}
              className="aspect-video w-full"
              iframeClassName="h-full w-full"
              opts={{
                width: '100%',
                height: '100%',
                playerVars: {
                  start: startSeconds,
                },
              }}
              onReady={handleReady}
              onStateChange={handleStateChange}
            />
          ) : (
            <div className="flex aspect-video items-center justify-center text-sm text-zinc-300">
              Invalid YouTube URL
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        {video.previous_video_id ? (
          <Link
            href={`/subjects/${params.subjectId}/video/${video.previous_video_id}`}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
          >
            Previous
          </Link>
        ) : (
          <span />
        )}

        {video.next_video_id ? (
          <Link
            href={`/subjects/${params.subjectId}/video/${video.next_video_id}`}
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Next
          </Link>
        ) : (
          <span />
        )}
      </div>
    </main>
  );
}
