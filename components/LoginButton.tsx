import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { useSession, signIn, signOut, getSession } from "next-auth/react";
import Image from "next/image";
import { useEffect } from "react";

export default function LoginButton() {
  const { data: session, status } = useSession();

  if (session) {
    return (
      <div className="flex flex-col md:flex-row items-center gap-5">
        <div className="flex flex-col items-center justify-center  md:items-end md:justify-end">
          <Image
            draggable={false}
            src={
              session.user?.image ??
              "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Question_mark_%28black%29.svg/800px-Question_mark_%28black%29.svg.png"
            }
            width={50}
            height={50}
            alt="discord profile picture"
            className="rounded-lg"
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
