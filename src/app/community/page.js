import Link from "next/link";
import MainAppChrome from "@/components/layout/main-app-chrome";
import RouteSnapshotWriter from "@/components/navigation/route-snapshot-writer";

const communitySnapshot = {
  title: "Community",
  subtitle: "Community features are coming soon.",
};

export default async function CommunityPage() {
  return (
    <div className="min-h-screen bg-[#F1F8F1]">
      <RouteSnapshotWriter routeKey="/community" snapshot={communitySnapshot} />
      <MainAppChrome active="community">
        <main className="mx-auto max-w-lg px-4 py-12 text-center">
          <h1 className="text-xl font-bold text-zinc-900">Community</h1>
          <p className="mt-2 text-sm text-zinc-600">Community features are coming soon.</p>
          <Link
            href="/feed"
            className="mt-6 inline-block rounded-full border border-emerald-200 bg-white px-5 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
          >
            Back to feed
          </Link>
        </main>
      </MainAppChrome>
    </div>
  );
}
