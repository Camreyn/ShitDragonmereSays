import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { importTranscriptFile } from "../src/lib/importers";

const episodeId = process.argv[2];
const filePath = process.argv[3];

if (!episodeId || !filePath) {
  console.error("Usage: npm run import:transcript -- <episode-id> <file-path>");
  process.exit(1);
}

const resolvedPath = path.resolve(filePath);

fs.readFile(resolvedPath, "utf8")
  .then((contents) => importTranscriptFile(episodeId, path.basename(resolvedPath), contents))
  .then(() => {
    console.log(`Imported transcript for episode ${episodeId}`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
