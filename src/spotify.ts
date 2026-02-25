let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET is not set.");
    return null;
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    console.error(`Spotify token error: ${res.status} ${await res.text()}`);
    return null;
  }

  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
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

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    console.error(`Spotify search error: ${res.status} ${await res.text()}`);
    return null;
  }

  const json = (await res.json()) as {
    tracks?: { items?: Array<{ external_urls?: { spotify?: string } }> };
  };
  const track = json.tracks?.items?.[0];
  return track?.external_urls?.spotify ?? null;
}
