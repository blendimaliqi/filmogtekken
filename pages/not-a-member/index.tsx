import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

function Error() {
  const { data: session } = useSession();
  const errorMessage =
    "Oops, innlogging er kun for medlemmer av discord serveren";
  const screamImageProps = {
    src: "/scream.png",
    height: 400,
    width: 400,
  };
  const backButtonProps = {
    className:
      "text-5xl text-yellow-500 hover:text-yellow-700 font-bold items-center p-4 my-10",
    href: "/",
  };

  return (
    <>
      {!session ? (
        <div className="flex flex-col justify-center items-center mt-60">
          <h1 className="font-bold text-5xl p-10">{errorMessage}</h1>
          <Image alt="scream from scream movies" {...screamImageProps} />
          <Link {...backButtonProps}>Tilbake</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-16 justify-center items-center h-screen">
          <h1 className="font-bold text-5xl">Her var det lite...</h1>
          <Link {...backButtonProps}>Tilbake</Link>
        </div>
      )}
    </>
  );
}

export default Error;
