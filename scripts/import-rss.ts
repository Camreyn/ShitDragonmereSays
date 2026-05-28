import "dotenv/config";
import { importPodcastFeed } from "../src/lib/importers";

const sourceUrl = process.argv[2];

if (!sourceUrl) {
  console.error("Usage: npm run import:rss -- <feed-url>");
  process.exit(1);
}

importPodcastFeed(sourceUrl)
  .then(() => {
    console.log(`Imported RSS feed: ${sourceUrl}`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
