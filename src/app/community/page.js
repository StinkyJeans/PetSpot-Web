import Link from "next/link";
import { requirePrimaryPetProfile, requireUser } from "@/lib/auth/server";
import FeedTopNav from "@/components/feed/feed-top-nav";

export default async function CommunityPage() {
  const user = await requireUser();
  await requirePrimaryPetProfile(user.id);

  return (
    <div className="min-h-screen bg-[#F1F8F1]">
      <FeedTopNav active="community" />
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
    </div>
  );
}
