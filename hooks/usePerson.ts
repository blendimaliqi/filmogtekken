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
      const cachedAssetId = localStorage.getItem(imageUrlKey);

      let imageAssetId: string = "";

      if (cachedAssetId) {
        try {
          // The cached value might be the full asset object or just the ID
          // Try to parse it as JSON first to handle both cases
          const parsedCache = JSON.parse(cachedAssetId);

          // If it's the full asset object, extract just the _id
          if (typeof parsedCache === "object" && parsedCache._id) {
            imageAssetId = String(parsedCache._id);
            console.log("Using cached asset ID for image:", imageAssetId);
          } else if (typeof parsedCache === "string") {
            // If it's already just the ID string
            imageAssetId = parsedCache;
          } else if (parsedCache) {
            // Handle any other type by converting to string
            imageAssetId = String(parsedCache);
          }
        } catch (e) {
          // If it's not valid JSON, assume it's just the ID string
          imageAssetId = String(cachedAssetId);
          console.log("Using cached asset ID string:", imageAssetId);
        }
      }

      // If we don't have a valid imageAssetId from cache, upload a new one
      if (!imageAssetId) {
        try {
          // Upload the image and store the asset ID in localStorage
          const imageAsset = await uploadExternalImage(imageUrl);

          // Extract the ID from the asset and ensure it's a string
          if (imageAsset && imageAsset._id) {
            imageAssetId = String(imageAsset._id);

            // Cache just the asset ID as a string for future use
            localStorage.setItem(imageUrlKey, imageAssetId);
            localStorage.setItem(
              `${imageUrlKey}_timestamp`,
              Date.now().toString()
            );

            console.log("Uploaded new image asset:", imageAssetId);
          } else {
            throw new Error("Failed to get valid asset ID from uploaded image");
          }
        } catch (error) {
          console.error("Error uploading image:", error);
          throw error;
        }
      }

      // Check if we have a valid imageAssetId before proceeding
      if (!imageAssetId) {
        throw new Error("No valid image asset ID available");
      }

      // Log the final imageAssetId being used
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
    },
    onSuccess: () => {
      // Invalidate and refetch the current person data
      queryClient.invalidateQueries({ queryKey: personKeys.current() });
    },
    onError: (error) => {
      console.error("Error in useUpdateProfileImage:", error);
    },
  });
}
