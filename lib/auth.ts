import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/drive.readonly"
        }
      }
    }),
    CredentialsProvider({
      name: "Dummy Login",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "kevinhlo@gmail.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (credentials?.email === "kevinhlo@gmail.com" && credentials?.password === "SkiCoachApp") {
          return { id: "1", name: "Kevin H", email: "kevinhlo@gmail.com" }
        }
        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }: any) {
      session.accessToken = token.accessToken
      return session
    },
    async signIn({ account, profile }) {
      if (account?.provider === "credentials") {
        return true
      }
      if (account?.provider === "google") {
        const googleProfile = profile as any;
        const allowedEmails = ["eliott.lo@gmail.com"];
        const isAllowed = googleProfile?.email_verified && (
          googleProfile?.email?.endsWith("@cardigan.org") || 
          allowedEmails.includes(googleProfile?.email)
        );
        return !!isAllowed;
      }
      return true
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
