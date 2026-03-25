import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/AuthGuard";
import ChatBot from "@/components/chat/ChatBot";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen relative">
        <Navbar />
        <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-8 min-h-screen">
          {children}
        </main>
        <ChatBot />
      </div>
    </AuthGuard>
  );
}

