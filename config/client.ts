import { createClient, SanityClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import { ImageUrlBuilder } from "@sanity/image-url/lib/types/builder";

// Get environment variables with fallbacks
const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || "dev";
const projectId =
  process.env.SANITY_PROJECT_ID ||
  process.env.REACT_APP_SANITY_PROJECT_ID ||
  "mp1k1dez";
const token =
  process.env.SANITY_TOKEN || process.env.REACT_APP_SANITY_TOKEN || "";

// Create a read-only client (faster, used for most operations)
export const client = createClient({
  projectId,
  dataset,
  useCdn: true, // Use the CDN for better performance on read-only operations
  apiVersion: "2023-05-02",
});

// Create a client with write access
export const clientWithToken = createClient({
  projectId,
  dataset,
  useCdn: false, // Don't use CDN for write operations to ensure data is fresh
  apiVersion: "2023-05-02",
  token: token,
});

// Create image URL builder
const builder = imageUrlBuilder(client);

// Simple image URL helper
export const urlFor = (source: any): ImageUrlBuilder => {
  if (!source) {
    // Simple fallback for missing images
    return builder.image("image-placeholder");
  }
  return builder.image(source);
};

// Basic API functions
export async function getPosts() {
  try {
    return await client.fetch('*[_type == "post"]');
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

export async function createPost(post: any) {
  try {
    return await clientWithToken.create(post);
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
}

export async function updateDocumentTitle(_id: string, title: string) {
  try {
    return await clientWithToken.patch(_id).set({ title }).commit({});
  } catch (error) {
    console.error("Error updating document title:", error);
    throw error;
  }
}
