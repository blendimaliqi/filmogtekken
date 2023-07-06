import { useSession, signIn, signOut, getSession } from "next-auth/react";
import Image from "next/image";
import { useEffect } from "react";

export default function LoginButton() {
  const { data: session, status } = useSession();

  if (session) {
    return (
      <div className="flex items-center gap-5">
        <div>
          <Image
            draggable={false}
            src={
              session.user?.image ??
              "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Question_mark_%28black%29.svg/800px-Question_mark_%28black%29.svg.png"
            }
            width={50}
            height={50}
            alt="discord profile picture"
          />
          <p>{session?.user?.name}</p>
        </div>
        <button
          className="whitespace-nowrap bg-yellow-700 p-2 rounded-lg w-24 text-white opacity-90
          hover:bg-yellow-600 transition duration-300 ease-in-out
        "
          onClick={() => signOut()}
        >
          Logg ut
        </button>
      </div>
    );
  }
  return (
    <div className="">
      <button
        className="whitespace-nowrap bg-yellow-700 p-2 rounded-lg w-24 text-white opacity-90
        hover:bg-yellow-600 transition duration-300 ease-in-out
        "
        onClick={() => signIn()}
      >
        Logg inn
      </button>
    </div>
  );
}
