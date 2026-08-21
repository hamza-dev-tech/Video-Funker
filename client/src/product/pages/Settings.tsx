import { useState } from "react";
import { MainLayout } from "@product/components/layout/MainLayout";
import { PageHeader } from "@product/components/layout/PageHeader";
import { Button } from "@product/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@product/hooks/useAuth";
import { DeleteAccountModal } from "@product/components/settings/DeleteAccountModal";
import { ChangePasswordCard } from "@product/components/settings/ChangePasswordCard";

export default function Settings() {
  const { user } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <MainLayout>
      <div className="space-y-8">
        <PageHeader title="Settings" description="Your account and the data attached to it." />

        <section>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
            Account
          </h2>
          <div className="rounded-[14px] border border-border/70 bg-card p-6">
            <p className="text-[13px] font-semibold text-muted-foreground">Signed in as</p>
            <p className="mt-1 font-display text-[17px] font-bold text-foreground">{user?.email}</p>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
            Security
          </h2>
          <ChangePasswordCard />
        </section>

        {/*
          The danger zone is last and visually separate. It is the only
          irreversible control in the product, and reaching it should take a
          deliberate scroll rather than sitting beside ordinary settings.
        */}
        <section>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.13em] text-destructive">
            Danger zone
          </h2>
          <div className="rounded-[14px] border border-destructive/30 bg-destructive/[0.04] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" strokeWidth={1.9} />
              </span>
              <div className="flex-1 space-y-1.5">
                <h3 className="font-display text-[16px] font-bold text-foreground">
                  Delete this account
                </h3>
                <p className="max-w-[58ch] text-[14px] leading-relaxed text-muted-foreground">
                  Removes every campaign, video, avatar, generated document and
                  upload, permanently. There is no export and no undo.
                </p>
              </div>
              <Button
                variant="destructive"
                className="w-full flex-none sm:w-auto"
                onClick={() => setDeleteOpen(true)}
              >
                Delete account
              </Button>
            </div>
          </div>
        </section>
      </div>

      <DeleteAccountModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        email={user?.email ?? ""}
      />
    </MainLayout>
  );
}
