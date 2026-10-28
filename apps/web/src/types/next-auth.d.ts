import { DefaultSession, DefaultUser } from 'next-auth';
import { UserRole } from '@pawstay/shared';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      roles: UserRole[];
      avatarUrl?: string | null;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
    roles: UserRole[];
    avatarUrl?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    roles: UserRole[];
    avatarUrl?: string | null;
  }
}
