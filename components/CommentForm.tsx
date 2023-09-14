import { client } from "@/config/client";
import { uuidv4 } from "@/utils/helperFunctions";
import React, { useEffect, useState } from "react";

function CommentForm({ movieId, session }: { movieId: string; session: any }) {
  const [commentText, setCommentText] = useState("");
  const [person, setPerson] = useState<any | null>(null); // Use `any` temporarily

  async function getPerson() {
    if (session == null || session == undefined) {
      return null;
    } else {
      if (session.user == null || session.user == undefined) return null;
    }
    const userName = session.user.name;
    const personQuery = `*[_type == "person" && name == "${userName}"]`;
    const existingPerson = await client.fetch(personQuery);

    console.log("existingPerson", existingPerson[0]._id);
    return existingPerson;
  }

  useEffect(() => {
    async function fetchData() {
      const personData = await getPerson();
      setPerson(personData[0]);
    }

    fetchData();
  }, [session]);

  async function handleSubmit(e: any) {
    e.preventDefault();
    const movie = await client.getDocument(movieId);

    if (movie) {
      const newComment = {
        person: { _type: "reference", _ref: person._id },
        comment: commentText,
        _key: uuidv4(),
      };

      const updatedComments = [...(movie.comments || []), newComment];

      await client.patch(movieId).set({ comments: updatedComments }).commit();
    }
  }
  return (
    <form className="z-50" onSubmit={handleSubmit}>
      <textarea
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        placeholder="Add your comment..."
      />
      <button type="submit">Submit</button>
    </form>
  );
}

export default CommentForm;
