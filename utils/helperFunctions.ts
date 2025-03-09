import { client, clientWithToken } from "@/config/client";
import { SanityClient } from "@sanity/cli";

export async function deletePersonByName(
  personNameToDelete: string,
  sanityClient: SanityClient = clientWithToken
) {
  sanityClient
    .fetch(`*[_type == 'person' && name == $name]{_id}`, {
      name: personNameToDelete,
    })
    .then((result) => {
      if (result.length > 0) {
        const personId = result[0]._id;

        // Step 2: Delete the person document using the obtained _id
        sanityClient
          .delete(personId)
          .then(() => {
            console.log(`Successfully deleted ${personNameToDelete}`);
          })
          .catch((error) => {
            console.error("Deletion failed:", error);
          });
      } else {
        console.log(`No person found with the name ${personNameToDelete}`);
      }
    })
    .catch((error) => {
      console.error("Fetching person failed:", error);
    });
}

export function uuidv4() {
  // Public Domain/MIT
  var d = new Date().getTime(); //Timestamp
  var d2 =
    (typeof performance !== "undefined" &&
      performance.now &&
      performance.now() * 1000) ||
    0; //Time in microseconds since page-load or 0 if unsupported
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = Math.random() * 16; //random number between 0 and 16
    if (d > 0) {
      //Use timestamp until depleted
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      //Use microseconds since page-load if supported
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// In-memory cache for recently uploaded images
const imageCache = new Map();

export async function uploadExternalImage(url: string) {
  if (!url) {
    throw new Error("No URL provided for image upload");
  }

  // Normalize the URL by removing query parameters for consistent caching
  const normalizedUrl = url.split("?")[0];

  // Check if we have this image in our in-memory cache
  if (imageCache.has(normalizedUrl)) {
    console.log("Using cached image asset from memory:", normalizedUrl);
    return imageCache.get(normalizedUrl);
  }

  // Check if we have this image in localStorage
  const storageKey = `image_upload_${normalizedUrl}`;
  const cachedAssetId = localStorage.getItem(storageKey);

  if (cachedAssetId) {
    try {
      // The cached value might be a full asset object or just the ID
      let assetId: string;

      try {
        // Try to parse as JSON first
        const parsedCache = JSON.parse(cachedAssetId);
        // If it's an object with _id, use that
        if (
          typeof parsedCache === "object" &&
          parsedCache !== null &&
          parsedCache._id
        ) {
          assetId = String(parsedCache._id);
        } else if (typeof parsedCache === "string") {
          // Otherwise use the parsed value directly
          assetId = parsedCache;
        } else if (parsedCache) {
          // Handle any other type by converting to string
          assetId = String(parsedCache);
        } else {
          throw new Error("Invalid cached asset data");
        }
      } catch (e) {
        // If not valid JSON and starts with 'image-', use as is
        if (
          typeof cachedAssetId === "string" &&
          cachedAssetId.startsWith("image-")
        ) {
          assetId = cachedAssetId;
        } else {
          throw new Error("Invalid cached asset ID format");
        }
      }

      // Try to fetch the asset info from Sanity to verify it exists
      if (assetId) {
        try {
          const asset = await clientWithToken.getDocument(assetId);
          if (asset) {
            console.log(
              "Using cached image asset from storage:",
              normalizedUrl
            );
            // Update in-memory cache
            imageCache.set(normalizedUrl, asset);
            return asset;
          }
        } catch (fetchError) {
          console.log(
            "Error fetching cached asset, will upload new one:",
            fetchError
          );
          // Continue with upload if asset fetch fails
        }
      }
    } catch (error) {
      console.log("Error processing cached asset, will upload new one:", error);
      // Continue with upload if asset doesn't exist
    }
  }

  // Add rate limiting to prevent too many requests
  await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay between uploads

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch image: ${response.status} ${response.statusText}`
      );
    }

    const blob = await response.blob();
    const contentType = response.headers.get("content-type") || "image/jpeg"; // Provide a default value

    const asset = await clientWithToken.assets.upload("image", blob, {
      contentType,
    });

    if (!asset || !asset._id) {
      throw new Error("Failed to get valid asset from upload");
    }

    // Store in caches
    imageCache.set(normalizedUrl, asset);

    // Only store the ID string in localStorage
    localStorage.setItem(storageKey, asset._id);
    localStorage.setItem(`${storageKey}_timestamp`, Date.now().toString());

    console.log("Successfully uploaded image asset:", asset._id);
    return asset;
  } catch (error: any) {
    console.error("Error uploading image to Sanity:", error);
    // If we get a rate limit error, wait longer and try again once
    if (error.message && error.message.includes("Too Many Requests")) {
      console.log("Rate limited, waiting and retrying once...");
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch image on retry: ${response.status}`);
        }

        const blob = await response.blob();
        const contentType =
          response.headers.get("content-type") || "image/jpeg";
        const asset = await clientWithToken.assets.upload("image", blob, {
          contentType,
        });

        if (!asset || !asset._id) {
          throw new Error("Failed to get valid asset from retry upload");
        }

        // Store in caches - only store the ID string in localStorage
        imageCache.set(normalizedUrl, asset);
        localStorage.setItem(storageKey, asset._id);
        localStorage.setItem(`${storageKey}_timestamp`, Date.now().toString());

        console.log("Successfully uploaded image asset (retry):", asset._id);
        return asset;
      } catch (retryError) {
        console.error("Retry failed, returning error:", retryError);
        throw retryError;
      }
    }

    throw error;
  }
}
