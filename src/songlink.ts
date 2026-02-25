import https from "node:https";
import { searchSpotifyTrack } from "./spotify";

interface SonglinkPlatformInfo {
  url: string;
  entityUniqueId: string;
}

interface SonglinkEntityInfo {
  id: string;
  type: string;
  title?: string;
  artistName?: string;
  platforms: string[];
}

interface SonglinkResponse {
  entityUniqueId: string;
  entitiesByUniqueId: {
    [key: string]: SonglinkEntityInfo | undefined;
  };
  linksByPlatform: {
    spotify?: SonglinkPlatformInfo;
    youtubeMusic?: SonglinkPlatformInfo;
    [key: string]: SonglinkPlatformInfo | undefined;
  };
}

type Platform = "spotify" | "youtubeMusic";

function fetchJson(url: string): Promise<SonglinkResponse | null> {
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
            resolve(JSON.parse(data));
          } catch {
            resolve(null);
          }
        });
      })
      .on("error", () => resolve(null));
  });
}

export async function convertMusicUrl(
  sourceUrl: string,
  targetPlatform: Platform
): Promise<string | null> {
  const normalizedUrl = sourceUrl.replace(
    "music.youtube.com",
    "www.youtube.com"
  );
  const apiUrl = `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(normalizedUrl)}`;

  const json = await fetchJson(apiUrl);
  if (!json) return null;

  const platformInfo = json.linksByPlatform[targetPlatform];
  if (platformInfo?.url) return platformInfo.url;

  if (targetPlatform === "spotify") {
    const entity = json.entitiesByUniqueId[json.entityUniqueId];
    if (entity?.title && entity?.artistName) {
      return searchSpotifyTrack(entity.title, entity.artistName);
    }
  }

  return null;
}
