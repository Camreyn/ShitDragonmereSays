import "dotenv/config";
import { importYoutubeTranscriptsForSource } from "../src/lib/importers";

const sourceUrl = process.argv[2];
const force = process.argv.includes("--force");

if (!sourceUrl) {
  console.error("Usage: npm run import:youtube-transcripts -- <playlist-url>");
  process.exit(1);
}

importYoutubeTranscriptsForSource(sourceUrl, { force })
  .then((results) => {
    const imported = results.filter((result) => !result.error && !result.skipped);
    const skipped = results.filter((result) => result.skipped);
    const failed = results.filter((result) => result.error);

    console.log(`Imported transcripts for ${imported.length} episode(s).`);
    for (const result of imported) {
      console.log(`OK  ${result.title} (${result.segmentCount} segments)`);
    }

    if (skipped.length) {
      console.log(`Skipped transcript imports: ${skipped.length}`);
      for (const result of skipped) {
        console.log(`SKIP ${result.title} (${result.segmentCount} existing segments)`);
      }
    }

    if (failed.length) {
      console.log(`Failed transcript imports: ${failed.length}`);
      for (const result of failed) {
        console.log(`ERR ${result.title}: ${result.error}`);
      }
    }
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
