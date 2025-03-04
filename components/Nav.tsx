import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

function Nav() {
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <div className="hidden md:flex items-center p-24 w-full bg-transparent z-20">
      <Link
        draggable="false"
        href="/"
        className="text-3xl font-bold md:text-5xl text-yellow-400 hover:text-yellow-700 transition duration-300 ease-in-out cursor-pointer whitespace-nowrap"
      >
        Film med Gutta
      </Link>

      <div className="flex flex-row w-screen justify-end items-center">
        {session ? (
          <div className="flex flex-row items-center gap-4 bg-black bg-opacity-50 backdrop-blur-sm p-2 rounded-lg border border-gray-800">
            <div className="flex flex-row items-center gap-3 group relative">
              <Image
                draggable={false}
                src={
                  session.user?.image ??
                  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Question_mark_%28black%29.svg/800px-Question_mark_%28black%29.svg.png"
                }
                width={45}
                height={45}
                alt="discord profile picture"
                className="rounded-full border-2 border-yellow-600"
              />
              <div className="absolute left-full ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap bg-black bg-opacity-90 backdrop-blur-sm p-2 rounded-lg border border-gray-800 pointer-events-none">
                <div className="flex flex-col">
                  <span className="text-gray-200 font-medium text-sm">
                    {session.user?.name}
                  </span>
                  <span className="text-yellow-500 text-xs">Logget inn</span>
                </div>
              </div>
            </div>
            <button
              className="whitespace-nowrap bg-gradient-to-r from-yellow-700 to-yellow-600 px-4 py-2 rounded-lg text-white font-medium
              hover:from-yellow-600 hover:to-yellow-500 transition duration-300 ease-in-out shadow-md"
              onClick={() => signOut()}
            >
              Logg ut
            </button>
          </div>
        ) : (
          <button
            className="whitespace-nowrap bg-gradient-to-r from-yellow-700 to-yellow-600 px-4 py-2 rounded-lg text-white font-medium
            hover:from-yellow-600 hover:to-yellow-500 transition duration-300 ease-in-out shadow-md"
            onClick={() => signIn("discord")}
          >
            Logg inn
          </button>
        )}
      </div>
    </div>
  );
}

export default Nav;
