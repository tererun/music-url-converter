import https from "node:https";

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

function request(
  url: string,
  options: https.RequestOptions,
  body?: string
): Promise<{ status: number; data: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk: Buffer) => (data += chunk.toString()));
      res.on("end", () =>
        resolve({ status: res.statusCode ?? 0, data })
      );
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getAccessToken(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );
  const body = "grant_type=client_credentials";

  const res = await request(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
    body
  );

  if (res.status !== 200) return null;

  const json = JSON.parse(res.data);
  cachedToken = json.access_token;
  tokenExpiresAt = Date.now() + (json.expires_in - 60) * 1000;
  return cachedToken;
}

export async function searchSpotifyTrack(
  title: string,
  artist: string
): Promise<string | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const query = encodeURIComponent(`track:${title} artist:${artist}`);
  const url = `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`;

  const res = await request(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status !== 200) return null;

  const json = JSON.parse(res.data);
  const track = json.tracks?.items?.[0];
  return track?.external_urls?.spotify ?? null;
}
