const appName = process.env.NEXT_PUBLIC_APP_NAME || "Labveil";

export const metadata = {
  title: `Assets | ${appName}`,
  description: "Browse and manage your uploaded media assets",
};

import AssetsPageClient from "./AssetsPageClient";

export default function AssetsPage() {
  return <AssetsPageClient />;
}
