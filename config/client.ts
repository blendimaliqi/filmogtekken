import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

// Determine which dataset to use based on custom environment variable
// Try the NEXT_PUBLIC version first (for client-side), then fallback to server-only version
const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || "dev";
// Create a client for read-only operations
export const client = createClient({
  projectId:
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID,
  dataset: dataset,
  useCdn: true,
  apiVersion: "2023-05-02",
});

// Create a separate client for browser operations that need write access
export const clientWithToken = createClient({
  projectId:
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID,
  dataset: dataset,
  useCdn: false,
  apiVersion: "2023-05-02",
  token: process.env.SANITY_TOKEN,
});

const builder = imageUrlBuilder(client);

export const urlFor = (source: any) => builder.image(source);

export async function getPosts() {
  const posts = await client.fetch('*[_type == "post"]');
  return posts;
}

export async function createPost(post: any) {
  const result = clientWithToken.create(post);
  return result;
}

export async function updateDocumentTitle(_id: string, title: string) {
  const result = clientWithToken.patch(_id).set({ title });
  return result;
}
