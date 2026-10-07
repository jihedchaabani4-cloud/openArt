import { redirect } from "next/navigation";

export default async function GenerationsEditRedirectPage({ params }) {
    const { projectId, workflowId } = await params;
    redirect(`/cinema-studio/${projectId}/assets/edit/${workflowId}`);
}
