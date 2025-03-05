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
      const imageAsset = await uploadExternalImage(imageUrl);

      return clientWithToken
        .patch(personId)
        .set({
          image: {
            _type: "image",
            asset: {
              _ref: imageAsset._id,
            },
          },
        })
        .commit();
    },
    onSuccess: () => {
      // Invalidate and refetch the current person data
      queryClient.invalidateQueries({ queryKey: personKeys.current() });
    },
  });
}
