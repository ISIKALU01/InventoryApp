import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Mock user database
const users = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@example.com",
    password: "admin123",
    role: "admin",
    avatar: "/avatars/admin.png",
    department: "Administration"
  },
  {
    id: "2",
    name: "John Doe",
    email: "john@example.com",
    password: "john123",
    role: "staff",
    avatar: "/avatars/john.png",
    department: "Sales"
  },
  {
    id: "3",
    name: "Jane Smith",
    email: "jane@example.com",
    password: "jane123",
    role: "staff",
    avatar: "/avatars/jane.png",
    department: "Inventory"
  }
];

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = users.find((user) => user.email === credentials.email);

        if (user && user.password === credentials.password) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            department: user.department
          };
        }

        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.department = user.department;
        token.avatar = user.avatar;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.department = token.department;
        session.user.avatar = token.avatar;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  // Add session strategy for better compatibility
  session: {
    strategy: "jwt",
  },
  // Debug mode for development
  debug: process.env.NODE_ENV === 'development',
});