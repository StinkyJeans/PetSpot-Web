import EventSection from "@/components/event/event-section";
import FeedLeftSidebar from "@/components/feed/feed-left-sidebar";
import FeedRightSidebar from "@/components/feed/feed-right-sidebar";

/**
 * Shared 3-column layout (mint bg applied on parent): left explore + events, center column, right trending.
 */
export default function FeedShell({
  children,
  myEvents = [],
  otherEvents = [],
  profileName = "Profile",
  profileImageUrl = "",
}) {
  return (
    <>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[1fr_2fr_1fr]">
        <aside className="hidden lg:block">
          <div className="lg:fixed lg:bottom-4 lg:left-[calc(50%-min(80rem,calc(100vw-2rem))/2)] lg:top-[5.5rem] lg:w-[calc((min(80rem,calc(100vw-2rem))-3rem)/4)] lg:overflow-y-auto">
            <FeedLeftSidebar
              showEventSection={false}
              profileName={profileName}
              profileImageUrl={profileImageUrl}
            />
          </div>
        </aside>

        <div className="flex flex-col gap-5">{children}</div>

        <aside className="hidden lg:block">
          <div className="lg:fixed lg:bottom-4 lg:right-[calc(50%-min(80rem,calc(100vw-2rem))/2)] lg:top-[5.5rem] lg:w-[calc((min(80rem,calc(100vw-2rem))-3rem)/4)] lg:overflow-y-auto">
            <FeedRightSidebar>
              <EventSection myEvents={myEvents} otherEvents={otherEvents} />
            </FeedRightSidebar>
          </div>
        </aside>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-10 lg:hidden">
        <div className="grid gap-6 sm:grid-cols-2">
          <FeedLeftSidebar
            showEventSection={false}
            profileName={profileName}
            profileImageUrl={profileImageUrl}
          />
          <FeedRightSidebar>
            <EventSection myEvents={myEvents} otherEvents={otherEvents} />
          </FeedRightSidebar>
        </div>
      </div>
    </>
  );
}
