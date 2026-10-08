import Head from "next/head";
import Link from "next/link";
import { FaLock } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { homePathFor } from "../../utils/permissions";

export default function Unauthorized() {
  const { user, status, logout } = useAuth();
  const home = homePathFor(user);
  const hasHome = status === "ready" && home !== "/unauthorized";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Head>
        <title>No access - SellaPad</title>
      </Head>
      <div className="max-w-md w-full bg-white shadow rounded-lg p-8 text-center">
        <FaLock className="mx-auto h-10 w-10 text-indigo-600" />
        <h1 className="mt-4 text-xl font-semibold text-gray-900">You don&apos;t have access to this page</h1>
        <p className="mt-2 text-sm text-gray-600">
          {status === "ready"
            ? `Your role (${user?.role_label || user?.role || "unknown"}) can't open this page. If you need it, ask an admin to change your role.`
            : "Please log in to continue."}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          {hasHome && (
            <Link href={home} className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
              Go to my start page
            </Link>
          )}
          {status === "ready" ? (
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Log out
            </button>
          ) : (
            <Link href="/" className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
              Go to login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
