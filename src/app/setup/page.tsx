import SetupWizard from "@/components/setup/SetupWizard";

export default function SetupPage({
  searchParams,
}: {
  searchParams?: { notice?: string };
}) {
  return <SetupWizard notice={searchParams?.notice} />;
}
