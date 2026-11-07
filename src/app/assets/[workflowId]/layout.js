import AssetDetailNavbar from "@/features/assets/ui/AssetDetailNavbar";
import { UserDropdown } from "@/widgets/navigation/UserDropdown";

export default async function AssetDetailLayout({ children, params }) {
  const { workflowId } = await params;

  return (
    <div className="min-h-screen bg-background">
      <AssetDetailNavbar workflowId={workflowId} userSlot={<UserDropdown />} />
      <div className="flex min-h-[calc(100vh-75px)] flex-col">{children}</div>
    </div>
  );
}
