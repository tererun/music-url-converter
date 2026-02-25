import { searchSpotifyTrack } from "./spotify";

async function main() {
  console.log("SPOTIFY_CLIENT_ID:", process.env.SPOTIFY_CLIENT_ID ? "set" : "NOT SET");
  console.log("SPOTIFY_CLIENT_SECRET:", process.env.SPOTIFY_CLIENT_SECRET ? "set" : "NOT SET");

  const result = await searchSpotifyTrack("yep", "SEE");
  console.log("result:", result);
}

main();
