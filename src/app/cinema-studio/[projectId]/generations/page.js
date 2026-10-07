import { redirect } from "next/navigation";

export default async function GenerationsRedirectPage({ params }) {
    const { projectId } = await params;
    redirect(`/cinema-studio/${projectId}/assets`);
}
