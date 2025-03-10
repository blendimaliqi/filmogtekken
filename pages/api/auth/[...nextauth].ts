import NextAuth from "next-auth";
import { Provider } from "next-auth/providers";
import { AuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

const authOptions: AuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID ?? "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          scope: "identify email guilds",
          redirect_uri: process.env.NEXTAUTH_URL + "/api/auth/callback/discord",
        },
      },
    }) as Provider,
  ],

  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ account }) {
      if (account?.provider === "discord") {
        const guildId = process.env.DISCORD_GUILD_ID;

        const guildId2 = process.env.DISCORD_GUILD_ID2;

        const response = await fetch(
          "https://discord.com/api/v10/users/@me/guilds",
          {
            headers: {
              Authorization: `Bearer ${account?.access_token}`,
            },
          }
        );

        if (response.ok) {
          const guilds = await response.json();

          const isMember = guilds.some(
            (guild: any) => guild.id === guildId || guild.id === guildId2
          );

          if (!isMember) {
            throw new Error("You are not a member of the desired guild");
          }
        } else {
          console.error(
            "Failed to fetch user guilds. Status:",
            response.status
          );
          throw new Error("Failed to fetch user guilds");
        }
      }

      return Promise.resolve(true);
    },
  },

  pages: {
    error: "/not-a-member",
  },
};

export default NextAuth(authOptions);
