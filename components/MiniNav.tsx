import Link from "next/link";
import React from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

function MiniNav() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  return (
    <nav className="flex w-full justify-between items-center px-4 py-4 md:hidden z-50 bg-black bg-opacity-80 backdrop-blur-sm">
      {/* Title section */}
      <div className="flex-1 flex justify-center">
        <Link
          draggable="false"
          href="/"
          className="text-2xl font-bold text-yellow-400 hover:text-yellow-500 transition duration-300 ease-in-out cursor-pointer"
        >
          Film med Gutta
        </Link>
      </div>

      {/* Login section */}
      <div className="flex items-center">
        {isLoading ? (
          <div className="bg-black bg-opacity-70 backdrop-blur-sm p-1.5 rounded-lg border border-gray-800">
            <div className="w-28 h-7 bg-gray-700 animate-pulse rounded"></div>
          </div>
        ) : session ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-black bg-opacity-70 backdrop-blur-sm p-1.5 rounded-lg border border-gray-800">
              <Image
                draggable={false}
                src={
                  session.user?.image ??
                  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Question_mark_%28black%29.svg/800px-Question_mark_%28black%29.svg.png"
                }
                width={28}
                height={28}
                alt="discord profile picture"
                className="rounded-full border border-yellow-600"
              />
              <button
                className="ml-2 whitespace-nowrap bg-gradient-to-r from-yellow-700 to-yellow-600 px-2 py-1 rounded text-white text-xs font-medium
                hover:from-yellow-600 hover:to-yellow-500 transition duration-300 ease-in-out shadow-md"
                onClick={() => signOut()}
              >
                Logg ut
              </button>
            </div>
          </div>
        ) : (
          <button
            className="whitespace-nowrap bg-gradient-to-r from-yellow-700 to-yellow-600 px-3 py-1.5 rounded text-white text-sm font-medium
            hover:from-yellow-600 hover:to-yellow-500 transition duration-300 ease-in-out shadow-md"
            onClick={() =>
              signIn("discord", { callbackUrl: window.location.href })
            }
          >
            Logg inn
          </button>
        )}
      </div>
    </nav>
  );
}

export default MiniNav;
