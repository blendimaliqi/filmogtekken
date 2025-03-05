import { client, clientWithToken, urlFor } from "@/config/client";
import React, { useState, useEffect, useCallback } from "react";
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
}: {
  movieId: string;
  session: any;
  movieData: any;
  refetch: any;
}) {
  const [commentText, setCommentText] = useState("");

  // Use our custom hooks
  const { data: personData } = useCurrentPerson();
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  const updateProfileImage = useUpdateProfileImage();

  // Fetch comments using the useComments hook
  const { data: commentsData, isLoading: commentsLoading } =
    useComments(movieId);

  const updateProfileImageIfChanged = useCallback(
    async (person: any, currentImageUrl: string) => {
      if (!person || !person.image || !person.image.asset) return;

      try {
        // Get the current image URL from Sanity
        const storedImageUrl = urlFor(person.image).url();

        // Extract just the base URL without query parameters for comparison
        const storedImageBase = storedImageUrl.split("?")[0];
        const currentImageBase = currentImageUrl.split("?")[0];

        // If the Discord image URL has changed, update the person's image in Sanity
        if (storedImageBase !== currentImageBase) {
          console.log("Updating profile image...");

          updateProfileImage.mutate(
            {
              personId: person._id,
              imageUrl: currentImageUrl,
            },
            {
              onSuccess: () => {
                console.log("Profile image updated successfully");
                localStorage.setItem(
                  `profile_update_${person._id}`,
                  Date.now().toString()
                );
              },
              onError: (error) => {
                console.error("Error updating profile image:", error);
              },
            }
          );
        }
      } catch (error) {
        console.error("Error updating profile image:", error);
      }
    },
    [updateProfileImage]
  );

  useEffect(() => {
    if (session && session.user && personData && session.user.image) {
      const lastUpdateTime = localStorage.getItem(
        `profile_update_${personData._id}`
      );
      const currentTime = Date.now();

      // Only update if it's been more than 24 hours since the last update
      if (
        !lastUpdateTime ||
        currentTime - parseInt(lastUpdateTime) > 24 * 60 * 60 * 1000
      ) {
        updateProfileImageIfChanged(personData, session.user.image);
      }
    }
  }, [session, personData, updateProfileImageIfChanged]);

  async function postCommentToMovie(
    movieId: string,
    personId: string,
    commentText: string,
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!commentText.trim()) return;

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
        },
        onError: (error) => {
          console.error("Error posting comment:", error);
        },
      }
    );
  }

  async function deleteCommentFromMovie(commentId: string) {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      console.log("Deleting comment with ID:", commentId);

      deleteComment.mutate(
        {
          commentId,
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

  // Use commentsData if available, otherwise fall back to movieData.comments
  const comments = commentsData || movieData?.comments || [];

  // Log the comments to help debug
  console.log("Comments data:", comments);
  console.log("Movie data comments:", movieData?.comments);

  const sortedComments = [...comments].sort((a, b) => {
    const dateA = a.createdAt || a._createdAt;
    const dateB = b.createdAt || b._createdAt;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return (
    <div className="w-full">
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
                    disabled={!commentText.trim()}
                    className="bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg py-2 px-6 font-medium transition-all duration-300 shadow-lg hover:shadow-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Kommenter
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-black rounded-lg p-8 flex flex-col items-center justify-center mb-12 border border-gray-800">
          <FaRegCommentDots className="text-5xl text-gray-500 mb-4" />
          <p className="text-xl text-gray-400 text-center mb-6">
            Du må være logget inn for å se og legge til kommentarer
          </p>
          <button
            onClick={() => signIn()}
            className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white rounded-lg py-3 px-6 font-medium transition-all duration-300 shadow-lg hover:shadow-yellow-600/20 flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            Logg inn
          </button>
        </div>
      )}

      {/* Comments list */}
      {session && (
        <div className="space-y-6">
          {sortedComments.length === 0 ? (
            <div className="bg-black rounded-lg p-8 flex flex-col items-center justify-center border border-gray-800">
              <FaRegCommentDots className="text-5xl text-gray-500 mb-4" />
              <p className="text-xl text-gray-400">Ingen kommentarer enda</p>
              <p className="text-gray-500 mt-2">
                Bli den første til å kommentere denne filmen
              </p>
            </div>
          ) : (
            sortedComments.map((comment) => (
              <div
                key={comment._id || comment._key}
                className="bg-gray-900 rounded-lg p-5 border border-gray-800"
              >
                <div className="flex items-start gap-4">
                  {comment.person &&
                  comment.person.image &&
                  comment.person.image.asset ? (
                    <Image
                      width={40}
                      height={40}
                      src={urlFor(comment.person.image.asset).url()}
                      alt={comment.person.name || "User"}
                      className="rounded-full border-2 border-gray-800 shadow-md"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">?</span>
                    </div>
                  )}

                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-white">
                          {comment.person && comment.person.name
                            ? comment.person.name
                            : "Unknown"}
                        </p>
                        <p className="text-gray-400 text-sm">
                          <TimeAgo
                            date={comment.createdAt || comment._createdAt}
                          />
                        </p>
                      </div>

                      {/* Delete button (only for own comments) */}
                      {session &&
                        personData &&
                        comment.person &&
                        ((comment.person._id &&
                          comment.person._id === personData._id) ||
                          (comment.person._ref &&
                            comment.person._ref === personData._id)) && (
                          <button
                            className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                            title="Slett kommentar"
                            onClick={() => deleteCommentFromMovie(comment._key)}
                          >
                            <FaTrashAlt />
                          </button>
                        )}
                    </div>

                    <p className="mt-3 text-white">{comment.comment}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default CommentForm;
