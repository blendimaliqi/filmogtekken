import { client, clientWithToken, urlFor } from "@/config/client";
import { uuidv4, uploadExternalImage } from "@/utils/helperFunctions";
import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import TimeAgo from "react-timeago";
import { useQuery } from "@tanstack/react-query";
import { FaRegCommentDots, FaTrashAlt } from "react-icons/fa";
import { signIn } from "next-auth/react";

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

  const { data } = useQuery({
    queryKey: ["person"],
    queryFn: () => GetPerson(),
    onError: (error) => refetch(),
    enabled: !!session,
  });

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
          const imageAsset = await uploadExternalImage(currentImageUrl);

          await clientWithToken
            .patch(person._id)
            .set({
              image: {
                _type: "image",
                asset: {
                  _ref: imageAsset._id,
                },
              },
            })
            .commit();

          console.log("Profile image updated successfully");
          localStorage.setItem(
            `profile_update_${person._id}`,
            Date.now().toString()
          );
          refetch();
        }
      } catch (error) {
        console.error("Error updating profile image:", error);
      }
    },
    [refetch]
  );

  // Check if user's profile image has changed and update it
  useEffect(() => {
    if (session && data && session.user.image) {
      const lastUpdateTime = localStorage.getItem(`profile_update_${data._id}`);
      const currentTime = Date.now();

      // Only update if it's been more than 24 hours since the last update
      if (
        !lastUpdateTime ||
        currentTime - parseInt(lastUpdateTime) > 24 * 60 * 60 * 1000
      ) {
        updateProfileImageIfChanged(data, session.user.image);
      }
    }
  }, [session, data, updateProfileImageIfChanged]);

  async function GetPerson() {
    const userName = session.user.name;
    const personQuery = `*[_type == "person" && name == "${userName}"]`;
    const existingPerson = await client.fetch(personQuery);
    return existingPerson[0];
  }

  async function postCommentToMovie(
    movieId: any,
    personId: any,
    commentText: any,
    e: any
  ) {
    try {
      e.preventDefault();
      if (!commentText) return;
      const movie = await clientWithToken.getDocument(movieId);

      if (!movie) {
        console.error("Movie not found.");
        return;
      }

      const newComment = {
        _type: "inlineComment",
        person: {
          _type: "reference",
          _ref: personId,
        },
        comment: commentText,
        createdAt: new Date().toISOString(),
        _key: uuidv4(),
      };

      const updatedComments = [...(movie.comments || []), newComment];
      movie.comments = updatedComments;

      await clientWithToken.createOrReplace(movie);

      console.log("Comment posted successfully.");

      setCommentText("");
      refetch();
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  }
  const sortedComments = [...(movieData.comments || [])].sort((a, b) => {
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
              postCommentToMovie(movieId, data?._id, commentText, e)
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
                Vær den første til å kommentere!
              </p>
            </div>
          ) : (
            sortedComments.map((comment) => (
              <div
                key={uuidv4()}
                className="bg-gray-900 rounded-lg p-5 border border-gray-800"
              >
                <div className="flex items-start gap-4">
                  {/* User avatar */}
                  <div className="flex-shrink-0">
                    <Image
                      src={
                        comment.person && comment.person.image
                          ? urlFor(comment.person.image)
                              .width(100)
                              .height(100)
                              .url()
                          : "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Question_mark_%28black%29.svg/800px-Question_mark_%28black%29.svg.png"
                      }
                      width={40}
                      height={40}
                      className="rounded-full border-2 border-gray-800"
                      alt={
                        comment.person && comment.person.name
                          ? comment.person.name
                          : "User"
                      }
                    />
                  </div>

                  {/* Comment content */}
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">
                          {comment.person && comment.person.name
                            ? comment.person.name
                            : "User"}
                        </span>
                        <span className="text-sm text-gray-400">
                          <TimeAgo
                            date={comment.createdAt || comment._createdAt}
                            formatter={(value, unit, suffix) => {
                              if (unit === "second") {
                                if (value === 1) {
                                  return `${value} sekund ${suffix.replace(
                                    "ago",
                                    "siden"
                                  )}`;
                                } else {
                                  return `${value} sekunder ${suffix.replace(
                                    "ago",
                                    "siden"
                                  )}`;
                                }
                              } else if (unit === "minute") {
                                if (value === 1) {
                                  return `${value} minutt ${suffix.replace(
                                    "ago",
                                    "siden"
                                  )}`;
                                } else {
                                  return `${value} minutter ${suffix.replace(
                                    "ago",
                                    "siden"
                                  )}`;
                                }
                              } else if (unit === "hour") {
                                if (value === 1) {
                                  return `${value} time ${suffix.replace(
                                    "ago",
                                    "siden"
                                  )}`;
                                } else {
                                  return `${value} timer ${suffix.replace(
                                    "ago",
                                    "siden"
                                  )}`;
                                }
                              } else if (unit === "day") {
                                if (value === 1) {
                                  return `${value} dag ${suffix.replace(
                                    "ago",
                                    "siden"
                                  )}`;
                                } else {
                                  return `${value} dager ${suffix.replace(
                                    "ago",
                                    "siden"
                                  )}`;
                                }
                              } else if (unit === "week") {
                                if (value === 1) {
                                  return `${value} uke ${suffix.replace(
                                    "ago",
                                    "siden"
                                  )}`;
                                } else {
                                  return `${value} uker ${suffix.replace(
                                    "ago",
                                    "siden"
                                  )}`;
                                }
                              } else if (unit === "month") {
                                if (value === 1) {
                                  return `${value} måned ${suffix.replace(
                                    "ago",
                                    "siden"
                                  )}`;
                                } else {
                                  return `${value} måneder ${suffix.replace(
                                    "ago",
                                    "siden"
                                  )}`;
                                }
                              } else if (unit === "year") {
                                if (value === 1) {
                                  return `${value} år ${suffix.replace(
                                    "ago",
                                    "siden"
                                  )}`;
                                } else {
                                  return `${value} år ${suffix.replace(
                                    "ago",
                                    "siden"
                                  )}`;
                                }
                              }
                            }}
                          />
                        </span>
                      </div>

                      {/* Delete button (only for own comments) */}
                      {session &&
                        data &&
                        comment.person &&
                        comment.person._id === data._id && (
                          <button
                            className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                            title="Slett kommentar"
                            onClick={async () => {
                              const confirmDelete = window.confirm(
                                "Er du sikker på at du vil slette denne kommentaren?"
                              );

                              if (confirmDelete) {
                                try {
                                  const movieWithCommentToBeDeleted =
                                    await clientWithToken.getDocument(movieId);

                                  if (!movieWithCommentToBeDeleted) {
                                    console.error("Movie not found.");
                                    return;
                                  }

                                  const updatedComments = [
                                    ...(movieWithCommentToBeDeleted.comments ||
                                      []),
                                  ].filter((commentToBeDeleted) => {
                                    return (
                                      commentToBeDeleted._key !== comment._key
                                    );
                                  });

                                  movieWithCommentToBeDeleted.comments =
                                    updatedComments;

                                  await clientWithToken.createOrReplace(
                                    movieWithCommentToBeDeleted
                                  );
                                  refetch();
                                } catch (error) {
                                  console.error(
                                    "Error deleting comment:",
                                    error
                                  );
                                }
                              }
                            }}
                          >
                            <FaTrashAlt />
                          </button>
                        )}
                    </div>

                    <p className="mt-2 text-gray-300 whitespace-pre-wrap break-words">
                      {comment.comment}
                    </p>
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
