import { AssetDetailPage } from "@/views";

export default async function AssetWorkflowPage({ params }) {
  const { workflowId } = await params;

  return <AssetDetailPage workflowId={workflowId} />;
}
