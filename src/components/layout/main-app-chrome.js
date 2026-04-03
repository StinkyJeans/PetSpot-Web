import { requirePrimaryPetProfile, requireUser } from "@/lib/auth/server";
import { FeedMobileSidebarProvider } from "@/components/feed/feed-mobile-sidebar-context";
import FeedTopNav from "@/components/feed/feed-top-nav";
import { MessagesMobileSidebarProvider } from "@/components/messages/messages-mobile-sidebar-context";
import { formatProfileHeadline } from "@/lib/profile";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Shared shell: `FeedTopNav` + mobile sidebar provider for every main app route.
 * Use `chromeVariant="messages"` on `/messages` so the hamburger opens the conversations drawer
 * and the icon row matches the messages layout.
 *
 * @param {{ children: import("react").ReactNode, active?: string, searchInitialQuery?: string, chromeVariant?: "default" | "messages" }} props
 */
export default async function MainAppChrome({
  children,
  active,
  searchInitialQuery = "",
  chromeVariant = "default",
}) {
  const user = await requireUser();
  await requirePrimaryPetProfile(user.id);

  if (chromeVariant === "messages") {
    return (
      <MessagesMobileSidebarProvider>
        <FeedTopNav active={active} searchInitialQuery={searchInitialQuery} mobileMessagesLayout />
        {children}
      </MessagesMobileSidebarProvider>
    );
  }

  const supabase = await getSupabaseServerClient();
  const { data: primaryPet } = await supabase
    .from("pet_profiles")
    .select("owner_display_name, pet_name, profile_image_url")
    .eq("owner_id", user.id)
    .eq("is_primary", true)
    .maybeSingle();

  const profileName = formatProfileHeadline(primaryPet?.owner_display_name, primaryPet?.pet_name);
  const profileImageUrl = primaryPet?.profile_image_url ?? "";

  return (
    <FeedMobileSidebarProvider
      profileName={profileName}
      profileImageUrl={profileImageUrl}
      myEvents={[]}
      otherEvents={[]}
      followedEvents={[]}
    >
      <FeedTopNav active={active} searchInitialQuery={searchInitialQuery} />
      {children}
    </FeedMobileSidebarProvider>
  );
}
