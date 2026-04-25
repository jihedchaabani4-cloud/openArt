import { redirect } from "next/navigation";

export default async function ProjectDetailPage({ params }) {
    const { projectId } = await params;
    redirect(`/cinema-studio/${projectId}/generations`);
}
