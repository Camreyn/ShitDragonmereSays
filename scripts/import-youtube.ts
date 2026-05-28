import "dotenv/config";
import { importYoutubeMetadata } from "../src/lib/importers";

const sourceUrl = process.argv[2];

if (!sourceUrl) {
  console.error("Usage: npm run import:youtube -- <playlist-url>");
  process.exit(1);
}

importYoutubeMetadata(sourceUrl)
  .then(() => {
    console.log(`Imported YouTube metadata: ${sourceUrl}`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
