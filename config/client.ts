import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

export const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: "production",
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
  const result = client.create(post);
  return result;
}

export async function updateDocumentTitle(_id: string, title: string) {
  const result = client.patch(_id).set({ title });
  return result;
}
