import { client, clientWithToken, urlFor } from "@/config/client";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Image from "next/image";
import TimeAgo from "react-timeago";
import { FaRegCommentDots, FaTrashAlt } from "react-icons/fa";
import { signIn } from "next-auth/react";
import {
  useCurrentPerson,
  useAddComment,
  useDeleteComment,
  useUpdateProfileImage,
  useComments,
} from "@/hooks";

function CommentForm({
  movieId,
  session,
  movieData,
  refetch,
  hideHeading = false,
}: {
  movieId: string;
  session: any;
  movieData: any;
  refetch: any;
  hideHeading?: boolean;
}) {
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // Add a ref to track if we've already attempted to update the profile image in this session
  const profileUpdateAttemptedRef = useRef(false);

  // Check if the device is mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Use our custom hooks
  const { data: personData } = useCurrentPerson();
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  const updateProfileImage = useUpdateProfileImage();

  // Fetch comments using the useComments hook
  const {
    data: commentsData,
    isLoading: commentsLoading,
    isFetching: commentsFetching,
  } = useComments(movieId);

  // Use useMemo to avoid unnecessary re-renders
  const sortedComments = useMemo(() => {
    const comments = commentsData || movieData?.comments || [];
    return [...comments].sort((a, b) => {
      const dateA = a.createdAt || a._createdAt;
      const dateB = b.createdAt || b._createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [commentsData, movieData?.comments]);

  const updateProfileImageIfChanged = useCallback(
    async (person: any, currentImageUrl: string) => {
      if (!person || !person.image || !person.image.asset) return;

      try {
        // Check if we've already updated this image recently using local storage
        const lastUpdateKey = `profile_update_${person._id}`;
        const lastUpdateTime = localStorage.getItem(lastUpdateKey);
        const currentTime = Date.now();

        // Only update if it's been more than 24 hours since the last update
        if (
          lastUpdateTime &&
          currentTime - parseInt(lastUpdateTime) < 24 * 60 * 60 * 1000
        ) {
          console.log("Profile image was updated recently, skipping check");
          return;
        }

        // Get the current image URL from Sanity
        const storedImageUrl = urlFor(person.image).url();

        // Extract just the base URL without query parameters for comparison
        const storedImageBase = storedImageUrl.split("?")[0];
        const currentImageBase = currentImageUrl.split("?")[0];

        // If the URLs are identical, no need to update
        if (storedImageBase === currentImageBase) {
          console.log("Profile image URLs match, no update needed");
          // Still update the timestamp to prevent frequent checks
          localStorage.setItem(lastUpdateKey, currentTime.toString());
          return;
        }

        console.log("Profile image URLs differ, updating...");
        console.log("  Stored: ", storedImageBase);
        console.log("  Current:", currentImageBase);

        updateProfileImage.mutate(
          {
            personId: person._id,
            imageUrl: currentImageUrl,
          },
          {
            onSuccess: () => {
              console.log("Profile image updated successfully");
              localStorage.setItem(lastUpdateKey, currentTime.toString());
              // Set the ref to true to prevent further update attempts
              profileUpdateAttemptedRef.current = true;
            },
            onError: (error) => {
              console.error("Error updating profile image:", error);
            },
          }
        );
      } catch (error) {
        console.error("Error in updateProfileImageIfChanged:", error);
      }
    },
    [updateProfileImage]
  );

  useEffect(() => {
    // Only proceed if we haven't already attempted an update in this session
    if (profileUpdateAttemptedRef.current) {
      return;
    }

    // TEMPORARY FIX: Add this condition to skip profile image updates entirely
    const skipProfileUpdates =
      localStorage.getItem("skip_profile_updates") === "true";
    if (skipProfileUpdates) {
      console.log(
        "Skipping profile image updates due to previously detected issues"
      );
      return;
    }

    if (session && session.user && personData && session.user.image) {
      try {
        updateProfileImageIfChanged(personData, session.user.image);
      } catch (error) {
        console.error("Error in profile image update effect:", error);
        // If we encounter an error, set a flag to skip future profile updates
        localStorage.setItem("skip_profile_updates", "true");
      }
      // Always set the flag to indicate we've attempted an update in this session
      profileUpdateAttemptedRef.current = true;
    }
  }, [session, personData, updateProfileImageIfChanged]);

  async function postCommentToMovie(
    movieId: string,
    personId: string,
    commentText: string,
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);

    addComment.mutate(
      {
        comment: commentText,
        movieId,
        personId,
      },
      {
        onSuccess: () => {
          setCommentText("");
          refetch();
          setIsSubmitting(false);
        },
        onError: (error) => {
          console.error("Error posting comment:", error);
          setIsSubmitting(false);
        },
      }
    );
  }

  async function deleteCommentFromMovie(commentKey: string) {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      console.log("Deleting comment with key:", commentKey);

      deleteComment.mutate(
        {
          commentKey,
          movieId,
        },
        {
          onSuccess: () => {
            console.log("Comment deleted successfully");
            refetch();
          },
          onError: (error) => {
            console.error("Error deleting comment:", error);
          },
        }
      );
    }
  }

  // Render optimized comment form
  return (
    <div className="flex flex-col space-y-8">
      {!hideHeading && (
        <h2 className="text-2xl font-bold text-white">Kommentarer</h2>
      )}

      {session ? (
        <div className="bg-gray-900 rounded-lg p-5 border border-gray-800 mb-8">
          <form
            className="mb-0"
            onSubmit={(e) =>
              postCommentToMovie(movieId, personData?._id, commentText, e)
            }
          >
            <div className="flex items-start gap-4">
              {session.user.image && (
                <div className="flex-shrink-0">
                  <Image
                    src={session.user.image}
                    width={40}
                    height={40}
                    alt={session.user.name || "User"}
                    className="rounded-full border-2 border-gray-800 shadow-md"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="flex-grow">
                <div className="flex flex-col gap-2">
                  <span className="font-medium text-white">
                    {session.user.name}
                  </span>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Legg til en kommentar..."
                    className="w-full px-4 py-3 bg-gray-800 text-gray-300 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 min-h-[100px] resize-y"
                  />
                </div>

                <div className="flex justify-end mt-3">
                  <button
                    type="submit"
                    disabled={!commentText.trim() || isSubmitting}
                    className="bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg py-2 px-6 font-medium transition-all duration-300 shadow-lg hover:shadow-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-[2px] border-gray-600 border-t-yellow-500"></div>
                        <span>Kommenterer...</span>
                      </>
                    ) : (
                      "Kommenter"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-lg p-5 border border-gray-800 flex flex-col items-center">
          <p className="text-gray-400 mb-4">
            Du må være logget inn for å kommentere
          </p>
          <button
            onClick={() => signIn()}
            className="bg-yellow-600 hover:bg-yellow-500 text-white rounded py-2 px-4"
          >
            Logg inn for å kommentere
          </button>
        </div>
      )}

      {/* Comments section */}
      <div>
        {/* Loading state for comments */}
        {commentsLoading && (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-400"></div>
          </div>
        )}

        {/* Show comments if we have them */}
        {!commentsLoading && sortedComments.length > 0 && (
          <div className="space-y-6">
            {sortedComments.map((comment: any) => (
              <div
                key={comment._key || comment._id}
                className="bg-gray-900/60 rounded-lg p-4 border border-gray-800/50"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {comment.person && comment.person.image ? (
                      <Image
                        width={40}
                        height={40}
                        className="rounded-full"
                        src={urlFor(comment.person.image)
                          .width(40)
                          .height(40)
                          .url()}
                        alt={comment.person.name || "User"}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-300 text-sm">
                          {comment.person && comment.person.name
                            ? comment.person.name.charAt(0).toUpperCase()
                            : "?"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-white font-medium">
                        {comment.person ? comment.person.name : "Unknown User"}
                      </p>
                      <div className="flex items-center text-sm text-gray-500">
                        <TimeAgo
                          date={comment.createdAt || comment._createdAt}
                          formatter={(value, unit) => {
                            const units: { [key: string]: string } = {
                              second: "sekund",
                              seconds: "sekunder",
                              minute: "minutt",
                              minutes: "minutter",
                              hour: "time",
                              hours: "timer",
                              day: "dag",
                              days: "dager",
                              week: "uke",
                              weeks: "uker",
                              month: "måned",
                              months: "måneder",
                              year: "år",
                              years: "år",
                            };
                            return `${value} ${units[unit]} siden`;
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-gray-300 break-words">
                      {comment.comment}
                    </p>

                    {/* Delete button - only for the comment author */}
                    {session &&
                      comment.person &&
                      session.user.name === comment.person.name && (
                        <button
                          onClick={() => deleteCommentFromMovie(comment._key)}
                          className="mt-2 text-red-500 hover:text-red-400 text-sm flex items-center gap-1"
                          aria-label="Delete comment"
                        >
                          <FaTrashAlt size={12} />
                          <span>Slett</span>
                        </button>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No comments state */}
        {!commentsLoading && sortedComments.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">
              {session
                ? "Ingen kommentarer enda. Bli den første til å kommentere!"
                : "Ingen kommentarer enda."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CommentForm;
