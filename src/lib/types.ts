export interface Artist {
  id: number;
  name: string;
  image_url: string | null;
  bio?: string | null;
}

export interface Album {
  id: number;
  title: string;
  artist_id: number | null;
  cover_url: string | null;
  release_year: number | null;
  genre: string | null;
  source: string;
  artist?: Artist | null;
}

export interface Track {
  id: number;
  title: string;
  artist_id: number | null;
  album_id: number | null;
  audio_url: string;
  storage_path: string | null;
  cover_url: string | null;
  duration_ms: number | null;
  track_number: number | null;
  genre: string | null;
  release_year: number | null;
  license_url: string | null;
  plays_count: number;
  source: string;
  created_by: string | null;
  artist?: Artist | null;
  album?: Album | null;
}

export interface PlaylistTrack {
  playlist_id: number;
  track_id: number;
  position: number;
  added_at: string;
  track?: Track;
}

export interface Playlist {
  id: number;
  user_id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  is_public: boolean;
  created_at: string;
  playlist_tracks?: PlaylistTrack[];
}

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface PlayHistoryEntry {
  id: number;
  track_id: number;
  played_at: string;
  track?: Track;
}
