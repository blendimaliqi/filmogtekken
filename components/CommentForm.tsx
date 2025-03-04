import { client, clientWithToken, urlFor } from "@/config/client";
import { uuidv4 } from "@/utils/helperFunctions";
import React, { useState } from "react";
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
      <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-800 pb-2">Kommentarer</h2>
      
      {session ? (
        <form
          className="mb-12"
          onSubmit={(e) => postCommentToMovie(movieId, data?._id, commentText, e)}
        >
          <div className="flex items-start gap-4">
            {session.user.image && (
              <div className="flex-shrink-0">
                <Image
                  src={session.user.image}
                  width={40}
                  height={40}
                  alt={session.user.name || "User"}
                  className="rounded-full border-2 border-gray-700"
                />
              </div>
            )}
            
            <div className="flex-grow">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Legg til en kommentar..."
                className="w-full px-4 py-3 bg-gray-800/60 backdrop-blur-sm text-white rounded-xl border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-h-[100px] resize-y"
              />
              
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2 px-6 font-medium transition-all duration-300 shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Kommenter
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-8 flex flex-col items-center justify-center mb-12">
          <FaRegCommentDots className="text-5xl text-gray-500 mb-4" />
          <p className="text-xl text-gray-400 text-center mb-6">
            Du må være logget inn for å se og legge til kommentarer
          </p>
          <button
            onClick={() => signIn()}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white rounded-lg py-3 px-6 font-medium transition-all duration-300 shadow-lg hover:shadow-blue-500/20 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Logg inn
          </button>
        </div>
      )}

      {/* Comments list */}
      {session && (
        <div className="space-y-6">
          {sortedComments.length === 0 ? (
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-8 flex flex-col items-center justify-center">
              <FaRegCommentDots className="text-5xl text-gray-500 mb-4" />
              <p className="text-xl text-gray-400">Ingen kommentarer enda</p>
              <p className="text-gray-500 mt-2">Vær den første til å kommentere!</p>
            </div>
          ) : (
            sortedComments.map((comment) => (
              <div
                key={uuidv4()}
                className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-5 transition-all duration-300 hover:bg-gray-800/60"
              >
                <div className="flex items-start gap-4">
                  {/* User avatar */}
                  <div className="flex-shrink-0">
                    <Image
                      src={urlFor(comment.person.image).width(100).height(100).url() || ""}
                      width={40}
                      height={40}
                      className="rounded-full border-2 border-gray-700"
                      alt={comment.person.name || "User"}
                    />
                  </div>
                  
                  {/* Comment content */}
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{comment.person.name}</span>
                        <span className="text-sm text-gray-400">
                          <TimeAgo
                            date={comment.createdAt || comment._createdAt}
                            formatter={(value, unit, suffix) => {
                              if (unit === "second") {
                                if (value === 1) {
                                  return `${value} sekund ${suffix.replace("ago", "siden")}`;
                                } else {
                                  return `${value} sekunder ${suffix.replace("ago", "siden")}`;
                                }
                              } else if (unit === "minute") {
                                if (value === 1) {
                                  return `${value} minutt ${suffix.replace("ago", "siden")}`;
                                } else {
                                  return `${value} minutter ${suffix.replace("ago", "siden")}`;
                                }
                              } else if (unit === "hour") {
                                if (value === 1) {
                                  return `${value} time ${suffix.replace("ago", "siden")}`;
                                } else {
                                  return `${value} timer ${suffix.replace("ago", "siden")}`;
                                }
                              } else if (unit === "day") {
                                if (value === 1) {
                                  return `${value} dag ${suffix.replace("ago", "siden")}`;
                                } else {
                                  return `${value} dager ${suffix.replace("ago", "siden")}`;
                                }
                              } else if (unit === "week") {
                                if (value === 1) {
                                  return `${value} uke ${suffix.replace("ago", "siden")}`;
                                } else {
                                  return `${value} uker ${suffix.replace("ago", "siden")}`;
                                }
                              } else if (unit === "month") {
                                if (value === 1) {
                                  return `${value} måned ${suffix.replace("ago", "siden")}`;
                                } else {
                                  return `${value} måneder ${suffix.replace("ago", "siden")}`;
                                }
                              } else if (unit === "year") {
                                if (value === 1) {
                                  return `${value} år ${suffix.replace("ago", "siden")}`;
                                } else {
                                  return `${value} år ${suffix.replace("ago", "siden")}`;
                                }
                              }
                            }}
                          />
                        </span>
                      </div>
                      
                      {/* Delete button (only for own comments) */}
                      {session && data && comment.person._id === data._id && (
                        <button
                          className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                          title="Slett kommentar"
                          onClick={async () => {
                            const confirmDelete = window.confirm(
                              "Er du sikker på at du vil slette denne kommentaren?"
                            );

                            if (confirmDelete) {
                              const movieWithCommentToBeDeleted = await client.getDocument(movieId);

                              if (!movieWithCommentToBeDeleted) {
                                console.error("Movie not found.");
                                return;
                              }

                              const updatedComments = [
                                ...(movieWithCommentToBeDeleted.comments || []),
                              ].filter((commentToBeDeleted) => {
                                return commentToBeDeleted._key !== comment._key;
                              });

                              movieWithCommentToBeDeleted.comments = updatedComments;

                              await client.createOrReplace(movieWithCommentToBeDeleted);
                              refetch();
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
