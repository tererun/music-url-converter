import https from "node:https";

interface SonglinkPlatformInfo {
  url: string;
  entityUniqueId: string;
}

interface SonglinkResponse {
  entityUniqueId: string;
  linksByPlatform: {
    spotify?: SonglinkPlatformInfo;
    youtubeMusic?: SonglinkPlatformInfo;
    [key: string]: SonglinkPlatformInfo | undefined;
  };
}

type Platform = "spotify" | "youtubeMusic";

export async function convertMusicUrl(
  sourceUrl: string,
  targetPlatform: Platform
): Promise<string | null> {
  const normalizedUrl = sourceUrl.replace(
    "music.youtube.com",
    "www.youtube.com"
  );
  const apiUrl = `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(normalizedUrl)}`;

  return new Promise((resolve) => {
    https
      .get(apiUrl, (res) => {
        let data = "";
        res.on("data", (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on("end", () => {
          if (res.statusCode !== 200) {
            resolve(null);
            return;
          }
          try {
            const json: SonglinkResponse = JSON.parse(data);
            const platformInfo = json.linksByPlatform[targetPlatform];
            resolve(platformInfo?.url ?? null);
          } catch {
            resolve(null);
          }
        });
      })
      .on("error", () => {
        resolve(null);
      });
  });
}
