import { useSession, signIn, signOut, getSession } from "next-auth/react";
import { useEffect } from "react";

export default function LoginButton() {
  const { data: session, status } = useSession();

  useEffect(() => {
    const something = async () => {
      const asd = await fetch("https://discord.com/api/users/@me/guilds");

      console.log("ASDASD", asd);
    };

    something();
  }, [session]);

  if (session) {
    return (
      <>
        Signed in as {session?.user?.email}: member of {} <br />
        <button onClick={() => signOut()}>Sign out</button>
      </>
    );
  }
  return (
    <>
      Not signed in <br />
      <button onClick={() => signIn()}>Sign in</button>
    </>
  );
}
