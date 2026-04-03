import MainAppChrome from "@/components/layout/main-app-chrome";
import MessagesPageClient from "@/components/messages/messages-page-client";
import RouteSnapshotWriter from "@/components/navigation/route-snapshot-writer";
import { requirePrimaryPetProfile, requireUser } from "@/lib/auth/server";
import { loadMessagesPageData } from "@/lib/messages/server";

const messagesSnapshot = {
  title: "Messages",
  subtitle: "Chat with pet parents in real time.",
};

export default async function MessagesPage({ searchParams }) {
  const user = await requireUser();
  await requirePrimaryPetProfile(user.id);

  const params = await searchParams;
  const targetUserId = String(params?.user ?? "").trim();
  const conversationId = String(params?.conversation ?? "").trim();

  const { conversations, activeConversationId, initialMessages } = await loadMessagesPageData(user.id, {
    targetUserId,
    conversationId,
  });

  return (
    <div className="min-h-screen bg-[#F1F8F1]">
      <RouteSnapshotWriter routeKey="/messages" snapshot={messagesSnapshot} />
      <MainAppChrome active="messages" chromeVariant="messages">
        <MessagesPageClient
          viewerUserId={user.id}
          initialConversations={conversations}
          initialConversationId={activeConversationId}
          initialMessages={initialMessages}
        />
      </MainAppChrome>
    </div>
  );
}

