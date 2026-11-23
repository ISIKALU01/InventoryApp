// Shows a page only to users allowed to open it.
//   - not logged in            -> back to the login page
//   - logged in, not allowed   -> /unauthorized
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import SystemLoader from "./ui/SystemLoader";
import { canAccessPath, isPublicPath } from "../../utils/permissions";

const ACCESS_STEPS = [
  "Verifying session token",
  "Loading your role & permissions",
  "Syncing inventory ledger",
  "Preparing your workspace",
];

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
  if (status === "loading") return <SystemLoader message="Checking your access" steps={ACCESS_STEPS} />;
  if (status === "guest" || !allowed) return <SystemLoader message="Redirecting" steps={ACCESS_STEPS} />;

  return children;
}
