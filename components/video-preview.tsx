'use client';

import { VideoMetadata } from '@/lib/analyzers/types';
import { formatDuration } from '@/lib/analyzers/youtube-api';

interface VideoPreviewProps {
  video: VideoMetadata;
}

export function VideoPreview({ video }: VideoPreviewProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-video">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover"
        />
        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-sm px-2 py-1 rounded">
          {formatDuration(video.durationSeconds)}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h2 className="text-lg font-semibold text-white line-clamp-2 mb-2">
          {video.title}
        </h2>

        <a
          href={`https://youtube.com/channel/${video.channelId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-red-400 transition-colors"
        >
          {video.channelTitle}
        </a>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-400">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
            </svg>
            <span>{formatNumber(video.viewCount)} views</span>
          </div>

          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
            </svg>
            <span>{formatNumber(video.likeCount)} likes</span>
          </div>

          {video.commentCount !== null && (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
              </svg>
              <span>{formatNumber(video.commentCount)} comments</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
            </svg>
            <span>{formatDate(video.publishedAt)}</span>
          </div>
        </div>

        {/* Watch on YouTube link */}
        <a
          href={`https://youtube.com/watch?v=${video.videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
          </svg>
          Watch on YouTube
        </a>
      </div>
    </div>
  );
}
