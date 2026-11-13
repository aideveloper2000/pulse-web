import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudUpload, Loader2, Music2, Trash2 } from 'lucide-react';
import { fetchGenreStats, uploadTrack } from '../lib/api';
import { useAuthUser } from '../lib/useAuth';
import { useToasts } from '../store/toast';

type Status = 'pending' | 'uploading' | 'done' | 'error';

interface UploadItem {
  id: string;
  file: File;
  title: string;
  artist: string;
  genre: string;
  status: Status;
  error?: string;
}

let nextUploadId = 1;

export function UploadPage() {
  const user = useAuthUser();
  const navigate = useNavigate();
  const toast = useToasts((s) => s.push);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [genres, setGenres] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void fetchGenreStats()
      .then((stats) => setGenres(stats.map((g) => g.genre)))
      .catch(() => setGenres([]));
  }, []);

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-4 px-1 py-24 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.06] text-faint">
          <CloudUpload size={28} />
        </span>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Upload your music</h1>
          <p className="mt-1 text-sm text-muted">Sign in to store your own tracks in Supabase.</p>
        </div>
        <button
          onClick={() => navigate('/auth')}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-accent-ink hover:bg-accent-deep"
        >
          Sign in
        </button>
      </div>
    );
  }

  const addFiles = (files: FileList | File[]) => {
    const audio = Array.from(files).filter((f) => f.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac)$/i.test(f.name));
    if (!audio.length) {
      toast('Only audio files are supported', 'error');
      return;
    }
    const newItems: UploadItem[] = audio.map((file) => ({
      id: `up-${nextUploadId++}`,
      file,
      title: file.name.replace(/\.[^.]+$/, ''),
      artist: user.user_metadata?.display_name ?? 'You',
      genre: '',
      status: 'pending' as Status,
    }));
    setItems((prev) => [...prev, ...newItems]);
  };

  const update = (id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUploadAll = async () => {
    const pending = items.filter((item) => item.status !== 'done');
    if (!pending.length) return;
    setUploading(true);
    for (const item of pending) {
      update(item.id, { status: 'uploading', error: undefined });
      try {
        await uploadTrack(user.id, item.file, { title: item.title, artist: item.artist, genre: item.genre || null });
        update(item.id, { status: 'done' });
      } catch (err) {
        update(item.id, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Upload failed',
        });
      }
    }
    setUploading(false);
    toast('Uploads finished', 'success');
  };

  const pendingCount = items.filter((item) => item.status !== 'done').length;

  return (
    <div className="flex flex-col gap-6 px-1 pt-2 animate-fade">
      <div>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Upload music</h1>
        <p className="mt-1 text-sm text-muted">
          Your files are stored privately in Supabase Storage and play only for you.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
          dragging ? 'border-accent bg-accent/[0.06]' : 'border-line bg-raised/40'
        }`}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] text-muted">
          <CloudUpload size={26} />
        </span>
        <div>
          <div className="font-bold">Drag and drop your audio here</div>
          <p className="mt-1 text-sm text-muted">MP3, WAV, OGG, M4A or FLAC</p>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className="mt-1 rounded-full bg-fg px-5 py-2.5 text-sm font-bold text-base transition-transform hover:scale-105"
        >
          Browse files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">
              {pluralise(items.length)} ready
            </span>
            <button
              onClick={() => void handleUploadAll()}
              disabled={uploading || pendingCount === 0}
              className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-accent-ink transition-colors hover:bg-accent-deep disabled:opacity-50"
            >
              {uploading && <Loader2 size={16} className="animate-spin" />}
              {pendingCount === 0 ? 'All uploaded' : `Upload ${pendingCount} track${pendingCount === 1 ? '' : 's'}`}
            </button>
          </div>

          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-xl border border-line bg-raised/60 p-3.5 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-muted">
                  <Music2 size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <input
                    value={item.title}
                    onChange={(e) => update(item.id, { title: e.target.value })}
                    placeholder="Track title"
                    className="w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 text-sm font-semibold outline-none focus:border-line focus:bg-base"
                  />
                  <input
                    value={item.artist}
                    onChange={(e) => update(item.id, { artist: e.target.value })}
                    placeholder="Artist name"
                    className="w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 text-xs text-muted outline-none focus:border-line focus:bg-base"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={item.genre}
                  onChange={(e) => update(item.id, { genre: e.target.value })}
                  className="h-9 rounded-lg border border-line bg-base px-2.5 text-xs text-muted outline-none focus:border-accent"
                >
                  <option value="">Genre</option>
                  {genres.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
                {item.status === 'uploading' && <Loader2 size={16} className="animate-spin text-accent" />}
                {item.status === 'done' && <span className="text-xs font-bold text-accent">Uploaded</span>}
                {item.status === 'error' && (
                  <span className="max-w-[180px] truncate text-xs text-danger" title={item.error}>
                    {item.error}
                  </span>
                )}
                <button
                  onClick={() => remove(item.id)}
                  aria-label="Remove file"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-faint hover:text-danger"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs leading-relaxed text-faint">
        Uploads are private by default and appear under Your Library → Uploads. Only you can play them.
      </p>
    </div>
  );
}

function pluralise(n: number): string {
  return `${n} track${n === 1 ? '' : 's'}`;
}
