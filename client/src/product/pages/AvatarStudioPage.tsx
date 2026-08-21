import { AvatarStudioTab } from "@product/components/campaign/AvatarStudioTab";
import { MainLayout } from "@product/components/layout/MainLayout";
export default function AvatarStudioPage() {
  return (
    <MainLayout>
      <div className="flex-1 overflow-auto">
        <AvatarStudioTab />
      </div>
    </MainLayout>
  );
}
