import {
  useQuery,
  UseQueryResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { client, clientWithToken, urlFor } from "@/config/client";
import { useSession } from "next-auth/react";
import { uploadExternalImage } from "@/utils/helperFunctions";

// Query key factory for person data
export const personKeys = {
  all: ["persons"] as const,
  lists: () => [...personKeys.all, "list"] as const,
  list: (filters: string) => [...personKeys.lists(), { filters }] as const,
  details: () => [...personKeys.all, "detail"] as const,
  detail: (name: string) => [...personKeys.details(), name] as const,
  current: () => [...personKeys.all, "current"] as const,
};

// Hook to get the current logged-in user's person record
export function useCurrentPerson() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: personKeys.current(),
    enabled: !!session && !!session.user,
    queryFn: async () => {
      if (!session || !session.user || !session.user.name) return null;
      const personQuery = `*[_type == "person" && name == "${session.user.name}"]`;
      const result = await client.fetch(personQuery);
      return result[0] || null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to get a person by name
export function usePersonByName(name: string | undefined) {
  return useQuery({
    queryKey: personKeys.detail(name as string),
    enabled: !!name,
    queryFn: async () => {
      if (!name) return null;
      const personQuery = `*[_type == "person" && name == "${name}"]`;
      const result = await client.fetch(personQuery);
      return result[0] || null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to update a person's profile image
export function useUpdateProfileImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      personId,
      imageUrl,
    }: {
      personId: string;
      imageUrl: string;
    }) => {
      // Check if we've recently uploaded this image to avoid redundant uploads
      const imageUrlKey = `image_upload_${imageUrl.split("?")[0]}`;
      let imageAssetId: string = "";

      try {
        // First, try to get the cached asset ID from localStorage
        const cachedAssetId = localStorage.getItem(imageUrlKey);

        if (cachedAssetId) {
          try {
            // Try to parse the cached value
            const parsedValue = JSON.parse(cachedAssetId);

            // Handle different types of cached values
            if (typeof parsedValue === "object" && parsedValue !== null) {
              if ("_id" in parsedValue) {
                // It's an object with _id property
                imageAssetId = String(parsedValue._id);
                console.log(
                  "Using parsed object _id from cache:",
                  imageAssetId
                );
              } else if ("_ref" in parsedValue) {
                // It's an object with _ref property
                imageAssetId = String(parsedValue._ref);
                console.log(
                  "Using parsed object _ref from cache:",
                  imageAssetId
                );
              } else {
                // Try to stringify the object for debugging
                console.log(
                  "Cached object has no _id or _ref:",
                  JSON.stringify(parsedValue)
                );
                // We'll need to get a new image asset
                imageAssetId = "";
              }
            } else if (typeof parsedValue === "string") {
              // It's already a string ID
              imageAssetId = parsedValue;
              console.log("Using string ID from cache:", imageAssetId);
            } else {
              // For any other value, clear it and upload a new image
              console.log("Unexpected cached value type:", typeof parsedValue);
              localStorage.removeItem(imageUrlKey);
              imageAssetId = "";
            }
          } catch (e) {
            // If it's not valid JSON, check if it looks like a valid Sanity ID
            if (cachedAssetId.startsWith("image-")) {
              imageAssetId = cachedAssetId;
              console.log("Using cached image ID:", imageAssetId);
            } else {
              console.log("Invalid cached value, not using:", cachedAssetId);
              localStorage.removeItem(imageUrlKey);
              imageAssetId = "";
            }
          }
        }

        // If we still don't have a valid ID, upload the image
        if (!imageAssetId) {
          console.log("No valid cached asset ID found, uploading image...");
          const imageAsset = await uploadExternalImage(imageUrl);

          if (imageAsset && typeof imageAsset === "object") {
            if ("_id" in imageAsset) {
              imageAssetId = String(imageAsset._id);
              console.log("Uploaded new image asset, got ID:", imageAssetId);

              // Store just the ID string in localStorage for future use
              localStorage.setItem(imageUrlKey, JSON.stringify(imageAssetId));
              localStorage.setItem(
                `${imageUrlKey}_timestamp`,
                Date.now().toString()
              );
            } else {
              console.error(
                "Uploaded image asset missing _id property:",
                imageAsset
              );
              throw new Error("Uploaded image asset missing _id property");
            }
          } else {
            console.error("Invalid image asset returned:", imageAsset);
            throw new Error("Failed to get valid image asset from upload");
          }
        }

        // Final validation to ensure we have a string ID
        if (!imageAssetId || typeof imageAssetId !== "string") {
          throw new Error(`Invalid asset ID: ${JSON.stringify(imageAssetId)}`);
        }

        // Verify the imageAssetId is in the correct format (should start with 'image-')
        if (!imageAssetId.startsWith("image-")) {
          console.warn(
            "Asset ID may not be in the correct format:",
            imageAssetId
          );
        }

        // Log the final ID being used
        console.log(
          "Using image asset ID for patching:",
          imageAssetId,
          typeof imageAssetId
        );

        // Update the person document with the image asset reference
        return clientWithToken
          .patch(personId)
          .set({
            image: {
              _type: "image",
              asset: {
                _type: "reference",
                _ref: imageAssetId,
              },
            },
          })
          .commit();
      } catch (error) {
        console.error("Error in profile image update:", error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      // More careful invalidation - only replace the cached data instead of triggering a refetch
      queryClient.setQueryData(personKeys.current(), (oldData: any) => {
        if (!oldData) return oldData;

        // Extract the asset reference from the response or use the existing one
        const assetRef =
          data?.image?.asset?._ref || oldData?.image?.asset?._ref;

        // Update the image in the cached data
        return {
          ...oldData,
          image: {
            _type: "image",
            asset: {
              _type: "reference",
              _ref: assetRef,
            },
          },
        };
      });

      // Log success
      console.log("Profile image updated and cache updated manually");
    },
    onError: (error) => {
      console.error("Error in useUpdateProfileImage:", error);
    },
  });
}
