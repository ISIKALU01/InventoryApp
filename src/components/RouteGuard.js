// Shows a page only to users allowed to open it.
//   - not logged in            -> back to the login page
//   - logged in, not allowed   -> /unauthorized
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import { canAccessPath, isPublicPath } from "../../utils/permissions";

const FullScreenMessage = ({ text }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">{text}</p>
    </div>
  </div>
);

export default function RouteGuard({ children }) {
  const router = useRouter();
  const { user, status } = useAuth();
  const path = router.pathname;
  const isPublic = isPublicPath(path);
  const allowed = canAccessPath(user, path);

  useEffect(() => {
    if (isPublic || status === "loading") return;

    if (status === "guest") {
      router.replace("/");
    } else if (!allowed) {
      router.replace("/unauthorized");
    }
  }, [isPublic, status, allowed, router]);

  if (isPublic) return children;
  if (status === "loading") return <FullScreenMessage text="Checking your access..." />;
  if (status === "guest" || !allowed) return <FullScreenMessage text="Redirecting..." />;

  return children;
}
