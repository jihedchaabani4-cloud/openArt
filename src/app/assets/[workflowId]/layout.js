import AssetDetailNavbar from "./AssetDetailNavbar";

export default async function AssetDetailLayout({ children, params }) {
  const { workflowId } = await params;

  return (
    <div className="min-h-screen bg-[#050505]">
      <AssetDetailNavbar workflowId={workflowId} />
      <div className="flex min-h-[calc(100vh-75px)] flex-col">{children}</div>
    </div>
  );
}
