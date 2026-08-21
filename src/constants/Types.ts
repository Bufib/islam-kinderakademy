export type YoutubePlayerState =
  | "unstarted"
  | "ended"
  | "playing"
  | "paused"
  | "buffering"
  | "video cued";

export type YoutubeVideoPlayerProps = {
  videoId: string;
  width: number;
  height: number;
  play: boolean;
  autoFullscreen?: boolean;
  initialPlayerParams?: {
    start?: number;
    end?: number;
  };
  onChangeState?: (state: YoutubePlayerState | string) => void;
  onError?: (error?: string) => void;
  onReady?: () => void;
};

export type YoutubeVideoPlayerRef = {
  getCurrentTime: () => Promise<number>;
  requestFullscreen: () => Promise<boolean>;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
};
