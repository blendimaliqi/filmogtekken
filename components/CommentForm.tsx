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

  const textareaStyle = {
    width: "100%",
    padding: "0.5rem",
    marginTop: "0.5rem",
    borderRadius: "0.375rem",
    height: "5rem",
    fontSize: "1.125rem",
    backgroundColor: "#1f2937", // dark gray background
    color: "#ffffff", // white text
    border: "1px solid #4b5563", // gray border
    outline: "none",
    transition: "all 0.3s ease",
  };

  const textareaFocusStyle = {
    boxShadow: "0 0 0 2px rgba(156, 163, 175, 0.5)", // focus ring
    borderColor: "transparent",
  };

  return (
    <form
      className="z-50 flex flex-col items-center md:items-start justify-start w-full"
      onSubmit={(e) => postCommentToMovie(movieId, data?._id, commentText, e)}
    >
      <h1 className="mt-20 py-4">Kommentarer</h1>
      {session != null && (
        <div className="flex flex-col items-stretch md:items-end w-full">
          <textarea
            style={textareaStyle}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Legg til en kommentar"
            onFocus={(e) => {
              Object.assign(e.target.style, textareaFocusStyle);
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = "none";
              e.target.style.borderColor = "#4b5563";
            }}
          />
          <button
            className="bg-gray-800 text-lg md:text-xl text-gray-400 rounded-md p-2 mt-2 w-full md:w-36 hover:bg-gray-700 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:focus:ring-gray-600 dark:focus:border-transparent"
            type="submit"
          >
            Kommenter
          </button>
        </div>
      )}
      {!session && (
        <div className="flex flex-col items-center justify-center w-full py-8 gap-4">
          <p className="text-xl text-gray-400 text-center">
            Du må være logget inn for å se og legge til kommentarer
          </p>
          <button
            onClick={() => signIn()}
            className="bg-gray-800 text-lg md:text-xl text-gray-400 rounded-md p-2 mt-2 w-full md:w-36 hover:bg-gray-700 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
          >
            Logg inn
          </button>
        </div>
      )}

      {session &&
        (sortedComments.length === 0 ? (
          <div className="flex flex-col items-center justify-start w-full py-8 gap-2">
            <FaRegCommentDots className="text-7xl text-gray-400 " />
            <p className="text-xl text-gray-400">Ingen kommentarer enda</p>
          </div>
        ) : (
          <div className="flex flex-col text-lg md:text-xl max-w-3/4">
            {sortedComments.map((comment, index) => (
              <div
                key={uuidv4()}
                className="flex flex-row items-center justify-center md:justify-start w-full p-4 mt-4"
              >
                <div
                  className="flex flex-col w-full justify-center items-center md:justify-start md:items-start max-w-3/4"
                  key={uuidv4()}
                >
                  <div className="flex gap-2 text-lg md:text-2xl justify-center md:justify-start">
                    <div className="flex gap-2 pb-4">
                      <Image
                        src={
                          urlFor(comment.person.image)
                            .width(100)
                            .height(100)
                            .url() || ""
                        }
                        width={100}
                        height={100}
                        className="rounded-full md:w-12 md:h-12 w-8 h-8"
                        alt="Profile picture"
                      />

                      <p className="ml-2 mb-2 text-gray-400 font-bold ">
                        {comment.person.name}
                      </p>
                      <p className="text-gray-400">for</p>
                      <span className="text-gray-400">
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
                  </div>
                  <div className="flex flex-row items-center justify-center md:justify-start md:items-center max-w-3/4">
                    <p className="overflow-wrap break-word text-left text-gray-400 w-full">
                      {comment.comment}
                    </p>
                    {session != null &&
                      data != null &&
                      comment.person._id == data._id && (
                        <FaTrashAlt
                          className="ml-3 text-gray-400 cursor-pointer 
                      hover:text-gray-300
                      "
                          title="Slett kommentar"
                          onClick={async () => {
                            const confirmDelete = window.confirm(
                              "Er du sikker på at du vil slette denne kommentaren?"
                            );

                            if (confirmDelete) {
                              const movieWithCommentToBeDeleted =
                                await client.getDocument(movieId);

                              if (!movieWithCommentToBeDeleted) {
                                console.error("Movie not found.");
                                return;
                              }

                              const updatedComments = [
                                ...(movieWithCommentToBeDeleted.comments || []),
                              ].filter((commentToBeDeleted) => {
                                return commentToBeDeleted._key !== comment._key;
                              });

                              movieWithCommentToBeDeleted.comments =
                                updatedComments;

                              await client.createOrReplace(
                                movieWithCommentToBeDeleted
                              );
                              refetch();
                            }
                          }}
                        />
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
    </form>
  );
}

export default CommentForm;
