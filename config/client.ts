// sanity.js
import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
// Import using ESM URL imports in environments that supports it:
// import {createClient} from 'https://esm.sh/@sanity/client'

export const client = createClient({
  projectId: "mp1k1dez",
  dataset: "production",
  useCdn: true, // set to `false` to bypass the edge cache
  apiVersion: "2023-05-02", // use current date (YYYY-MM-DD) to target the latest API version
  // token: process.env.SANITY_SECRET_TOKEN // Only if you want to update content with the client
});

const builder = imageUrlBuilder(client);

export const urlFor = (source: any) => builder.image(source);

// uses GROQ to query content: https://www.sanity.io/docs/groq
export async function getPosts() {
  const posts = await client.fetch('*[_type == "post"]');
  return posts;
}

export async function createPost(post: any) {
  const result = client.create(post);
  return result;
}

export async function updateDocumentTitle(_id: string, title: string) {
  const result = client.patch(_id).set({ title });
  return result;
}
