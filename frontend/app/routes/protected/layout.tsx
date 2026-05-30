import { Navigate, Outlet, useLocation, useNavigate } from "react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import type { Role } from "@/types";
import Loader from "@/components/global/Loader";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getRouteConfig, navConfig } from "@/components/navigation/nav-config";
import Header from "@/components/navigation/Header";
import { getChatbotResponse } from "@/lib/api";
import { BrainCircuit, X, MessageSquare, Send } from "lucide-react";

const Layout = () => {
  const { data: session, isPending } = authClient.useSession();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const userRole = (session?.user?.role as Role) || "patient";

  // Chatbot states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [msgInput, setMsgInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "ai"; text: string }>>([
    { role: "ai", text: "Hello! I am MedFlow's clinical AI copilot. Ask me about drug interactions, ICD coding, or quality checklists." }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (isPending) return;

    // 2. Find configuration for current path
    const allNavItems = [...navConfig.navMain];
    const currentRouteConfig = getRouteConfig(pathname, allNavItems);

    // 3. Check Permissions
    if (currentRouteConfig) {
      const hasAccess = currentRouteConfig.allowedRoles.includes(userRole);

      if (!hasAccess) {
        toast.error("Unauthorized Access");
        navigate("/dashboard", { replace: true });
      }
    }
  }, [pathname, userRole, isPending, navigate]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim()) return;

    const userText = msgInput;
    setChatHistory((prev) => [...prev, { role: "user", text: userText }]);
    setMsgInput("");
    setIsTyping(true);

    try {
      const res = await getChatbotResponse(userText);
      setChatHistory((prev) => [...prev, { role: "ai", text: res.reply }]);
    } catch (error) {
      setChatHistory((prev) => [...prev, { role: "ai", text: "Sorry, I encountered an error checking clinical telemetry. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader label="Initializing Medflolw..." />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-card/50 relative">
        <Header />
        <main className="px-4 my-4">
          <Outlet />
        </main>

        {/* Floating AI Chatbot Bubble */}
        <div className="fixed bottom-6 right-6 z-50">
          {isChatOpen ? (
            <div className="w-80 h-96 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl flex flex-col overflow-hidden animate-bounce-in">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 text-white flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <BrainCircuit size={16} className="animate-pulse" />
                  <span className="font-bold text-xs uppercase tracking-wider">Clinical AI Copilot</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsChatOpen(false)} className="text-white hover:bg-white/10 p-1 h-7">
                  <X size={14} />
                </Button>
              </div>

              {/* Message Board */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
                {chatHistory.map((chat, idx) => (
                  <div key={idx} className={`flex ${chat.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`p-2.5 rounded-xl max-w-[85%] leading-relaxed ${
                      chat.role === "user" ? "bg-blue-600 text-white" : "bg-zinc-100 dark:bg-zinc-850 text-zinc-800 dark:text-zinc-205"
                    }`}>
                      {chat.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="text-[10px] text-zinc-400 italic">AI Copilot is analyzing clinical data...</div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-2.5 border-t border-zinc-150 dark:border-zinc-800 flex gap-2">
                <Input
                  placeholder="Ask a clinical question..."
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  className="h-8 text-xs rounded-lg"
                />
                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 h-8 rounded-lg">
                  <Send size={12} />
                </Button>
              </form>
            </div>
          ) : (
            <Button
              onClick={() => setIsChatOpen(true)}
              className="h-12 w-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 border border-white/10"
            >
              <MessageSquare size={20} />
            </Button>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
