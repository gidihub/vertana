import path from "node:path"
import { fileURLToPath } from "node:url"

import { loadEnv } from "./library-seed-utils.mjs"

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  loadEnv(path.join(root, ".env.local"))

  const { syncLegacyBlogPosts } = await import("../lib/cms/legacy-blog-import")

  const result = await syncLegacyBlogPosts()
  console.log(`Imported: ${result.imported}`)
  console.log(`Updated: ${result.updated}`)
  console.log(`Slugs: ${result.slugs.join(", ")}`)
  console.log("Done.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
