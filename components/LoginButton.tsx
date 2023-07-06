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
            src={session.user?.image!}
            width={50}
            height={50}
            alt="discord profile picture"
          />
          {session?.user?.name}
        </div>
        <button
          className="whitespace-nowrap bg-yellow-700 p-2 rounded-lg w-24 text-white opacity-90
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
        "
        onClick={() => signIn()}
      >
        Logg inn
      </button>
    </div>
  );
}
