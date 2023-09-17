import { client, urlFor } from "@/config/client";
import { uuidv4 } from "@/utils/helperFunctions";
import React, { useState } from "react";
import Image from "next/image";
import TimeAgo from "react-timeago";
import { useQuery } from "@tanstack/react-query";
import { FaRegCommentDots } from "react-icons/fa";

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
  const [person, setPerson] = useState<any | null>(null);

  const {} = useQuery({
    queryKey: ["person"],
    queryFn: () => getPerson(),
    onSuccess: (data) => {
      console.log("asd", data[0]._id);
      setPerson(data[0]);
    },
    onError: (error) => refetch(),
  });

  async function getPerson() {
    const userName = session.user.name;
    const personQuery = `*[_type == "person" && name == "${userName}"]`;
    const existingPerson = await client.fetch(personQuery);

    return existingPerson;
  }

  async function postCommentToMovie(
    movieId: any,
    personId: any,
    commentText: any,
    e: any
  ) {
    try {
      e.preventDefault();
      const movie = await client.getDocument(movieId);

      if (!movie) {
        console.error("Movie not found.");
        return;
      }

      const newComment = {
        _type: "comment",
        person: {
          _type: "reference",
          _ref: personId,
        },
        comment: commentText,
        _createdAt: new Date().toISOString(),
        _key: uuidv4(),
      };

      const updatedComments = [...(movie.comments || []), newComment];
      movie.comments = updatedComments;

      await client.createOrReplace(movie);

      console.log("Comment posted successfully.");

      setCommentText("");
      refetch();
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  }
  const sortedComments = [...(movieData.comments || [])].sort((a, b) => {
    return new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime();
  });

  return (
    <form
      className="z-50 flex flex-col items-start justify-center w-full"
      onSubmit={(e) => postCommentToMovie(movieId, person._id, commentText, e)}
    >
      <h1 className="mt-20 py-4">Kommentarer</h1>
      {session != null && (
        <div className="flex flex-col items-end w-3/4">
          <textarea
            className="w-full p-2 mt-2 rounded-md h-20 text-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:focus:ring-gray-600 dark:focus:border-transparent"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Legg til en kommentar"
          />
          <button
            className="bg-gray-800 text-xl text-gray-400 rounded-md p-2 mt-2 w-36 hover:bg-gray-700 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:focus:ring-gray-600 dark:focus:border-transparent"
            type="submit"
          >
            Kommenter
          </button>
        </div>
      )}

      {sortedComments.length === 0 ? (
        <div className="flex flex-col items-center justify-center w-3/4">
          <FaRegCommentDots className="text-7xl text-gray-400" />
          <p className="text-xl text-gray-400">Ingen kommentarer enda</p>
        </div>
      ) : (
        <div className="flex flex-col items-start justify-start text-xl w-3/4">
          {sortedComments.map((comment, index) => (
            <div
              key={uuidv4()}
              className="
            flex flex-row items-center justify-start w-full p-4 mt-4"
            >
              <div className="flex flex-col" key={uuidv4()}>
                <div className="flex gap-2 text-2xl">
                  <div className="flex gap-2 pb-4">
                    <Image
                      src={urlFor(comment.person.image).url() || ""}
                      width={50}
                      height={50}
                      className="rounded-full"
                      alt="Profile picture"
                    />
                    <p className="ml-2 mb-2 text-gray-400 font-bold ">
                      {comment.person.name}
                    </p>
                    <p className="text-gray-400">for</p>
                    <span className="text-gray-400">
                      <TimeAgo
                        date={comment._createdAt}
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
                            return `${value} dager ${suffix.replace(
                              "ago",
                              "siden"
                            )}`;
                          } else if (unit === "week") {
                            return `${value} uker ${suffix.replace(
                              "ago",
                              "siden"
                            )}`;
                          } else if (unit === "month") {
                            return `${value} måneder ${suffix.replace(
                              "ago",
                              "siden"
                            )}`;
                          } else if (unit === "year") {
                            return `${value} år ${suffix.replace(
                              "ago",
                              "siden"
                            )}`;
                          }
                        }}
                      />
                    </span>
                  </div>
                </div>
                <p className="ml-2 ">{comment.comment}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </form>
  );
}

export default CommentForm;
