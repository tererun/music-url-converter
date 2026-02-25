import { searchSpotifyTrack } from "./spotify";

async function main() {
  const result = await searchSpotifyTrack("yep", "SEE");
  console.log("result:", result);
}

main();
