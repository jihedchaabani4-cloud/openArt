import { ProjectsPage } from "@/views";

const appName = process.env.NEXT_PUBLIC_APP_NAME || "Labveil";

export const metadata = {
  title: `Cinema Studio | ${appName}`,
  description: "View and manage your AI-generated art projects",
};

export default function Page() {
  return <ProjectsPage />;
}
