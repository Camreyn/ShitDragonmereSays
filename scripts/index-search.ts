import "dotenv/config";
import { indexSearchDocuments } from "../src/lib/search-index";

indexSearchDocuments()
  .then(() => {
    console.log("Search indexing complete.");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
