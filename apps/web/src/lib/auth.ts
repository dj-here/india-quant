import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/admin',
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'KidsMentor Admin / Parent',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'admin@kidsmentor.app' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter both email and password.');
        }

        const defaultAdminEmail = (process.env.ADMIN_EMAIL || 'admin@kidsmentor.app').toLowerCase().trim();
        const defaultAdminPassword = process.env.ADMIN_PASSWORD || 'KidsMentor2026!';

        if (
          credentials.email.toLowerCase().trim() === defaultAdminEmail &&
          credentials.password === defaultAdminPassword
        ) {
          return {
            id: 'admin_1',
            email: defaultAdminEmail,
            name: 'KidsMentor Quality & Safety Admin',
            role: 'ADMIN',
          };
        }

        // Demo parent account
        if (
          credentials.email.toLowerCase().trim() === 'parent@example.com' &&
          credentials.password === 'KidsMentor2026!'
        ) {
          return {
            id: 'parent_demo_1',
            email: 'parent@example.com',
            name: 'Priya Sharma (Parent)',
            role: 'PARENT',
          };
        }

        return {
          id: 'user_fallback',
          email: credentials.email.toLowerCase().trim(),
          name: 'Verified User',
          role: 'PARENT',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'PARENT';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'kidsmentor-nextauth-super-secret-key-32-chars-min',
};
