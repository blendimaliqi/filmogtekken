import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

// Determine which dataset to use based on environment
const dataset = process.env.NODE_ENV === "development" ? "dev" : "production";

// Check if code is running on server or client
const isServer = typeof window === 'undefined';

// Create a client for server-side operations
export const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: dataset,
  useCdn: false,
  apiVersion: "2023-05-02",
  token: process.env.SANITY_TOKEN,
});

// Create a separate client for browser operations that need write access
export const clientWithToken = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
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
