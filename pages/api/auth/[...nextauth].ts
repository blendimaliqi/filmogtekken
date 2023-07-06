import NextAuth from "next-auth";
import { Provider } from "next-auth/providers";
import { AuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

export const authOptions: AuthOptions = {
  providers: [
    DiscordProvider({
      clientId: "1119999195206656101",
      clientSecret: "VSqJA5nlREZiSIcWuyPci2IneLLTYksy",
      authorization:
        "https://discord.com/api/oauth2/authorize?scope=identify+email+guilds",
    }) as Provider,
  ],
  callbacks: {
    async redirect(params: { url: string; baseUrl: string }) {
      const { url, baseUrl } = params;
      if (url.startsWith(baseUrl)) {
        return url;
      } else {
        return `${baseUrl}/api/auth/callback/discord`;
      }
    },

    async signIn({ account }) {
      if (account?.provider === "discord") {
        const guildId = "1089621917490761854";

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

          const isMember = guilds.some((guild: any) => guild.id === guildId);

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
