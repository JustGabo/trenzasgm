import { createClient } from "next-sanity"

export const client = createClient({
  projectId: "t4a6pobt",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: true,
})