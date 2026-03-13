import NextAuth, { Account, Profile } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async signIn({ account, profile }: { account: Account | null, profile?: Profile & { email_verified?: boolean, email?: string } }) {
      if (account?.provider === "google") {
        return !!(profile?.email_verified && profile?.email?.endsWith("@cardigan.org"))
      }
      return true
    },
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
