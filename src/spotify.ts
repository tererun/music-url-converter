import https from "node:https";

interface DeezerTrack {
  id: number;
  title: string;
  artist: { name: string };
  link: string;
}

interface DeezerSearchResponse {
  data?: DeezerTrack[];
}

interface SonglinkPlatformInfo {
  url: string;
}

interface SonglinkResponse {
  linksByPlatform: {
    spotify?: SonglinkPlatformInfo;
    [key: string]: SonglinkPlatformInfo | undefined;
  };
}

function fetchJson<T>(url: string): Promise<T | null> {
  return new Promise((resolve) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk: Buffer) => (data += chunk.toString()));
        res.on("end", () => {
          if (res.statusCode !== 200) {
            resolve(null);
            return;
          }
          try {
            resolve(JSON.parse(data) as T);
          } catch {
            resolve(null);
          }
        });
      })
      .on("error", () => resolve(null));
  });
}

export async function searchSpotifyTrack(
  title: string,
  artist: string
): Promise<string | null> {
  const query = encodeURIComponent(`track:"${title}" artist:"${artist}"`);
  const deezerUrl = `https://api.deezer.com/search?q=${query}&limit=1`;

  const deezer = await fetchJson<DeezerSearchResponse>(deezerUrl);
  const track = deezer?.data?.[0];
  if (!track) return null;

  const songlinkUrl = `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(track.link)}`;
  const songlink = await fetchJson<SonglinkResponse>(songlinkUrl);

  return songlink?.linksByPlatform?.spotify?.url ?? null;
}
