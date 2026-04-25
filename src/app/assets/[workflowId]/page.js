import AssetDetailPageClient from "./AssetDetailPageClient";

export default async function AssetWorkflowPage({ params }) {
  const { workflowId } = await params;

  return <AssetDetailPageClient workflowId={workflowId} />;
}
