import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@pawstay/db';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/admin/login',
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Admin Credentials',
      credentials: {
        email: { label: 'Admin Email', type: 'email', placeholder: 'admin@campusedge.in' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter both email and password.');
        }

        const admin = await prisma.adminUser.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!admin) {
          // Check if fallback hardcoded admin matches if DB is fresh
          const defaultEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@campusedge.in';
          const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'CampusEdgeAdmin2026!';
          if (
            credentials.email.toLowerCase().trim() === defaultEmail.toLowerCase() &&
            credentials.password === defaultPassword
          ) {
            return {
              id: 'super_admin_fallback',
              email: defaultEmail,
              name: 'CampusEdge Super Admin',
              role: 'ADMIN',
            };
          }
          throw new Error('Invalid email or password.');
        }

        const isValid = await bcrypt.compare(credentials.password, admin.passwordHash);
        if (!isValid) {
          throw new Error('Invalid email or password.');
        }

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'ADMIN';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role || 'ADMIN';
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'campusedge_jwt_secret_token_secure_production_32_chars_minimum!',
};
