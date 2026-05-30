import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Send,
  MessageSquare,
  User,
  Calendar,
  Clock,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export function meta() {
  return [{ title: "Telemedicine Consultation | MedFlow AI" }];
}

interface ChatMessage {
  sender: "doctor" | "patient";
  text: string;
  time: string;
}

export default function Telemedicine() {
  const [inCall, setInCall] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: "patient", text: "Hello Doctor, I've been feeling a bit dizzy since yesterday.", time: "10:15 AM" },
    { sender: "doctor", text: "Hello Jane, let's review your symptoms. Did you take your prescribed heart medication today?", time: "10:16 AM" },
  ]);

  const handleStartCall = () => {
    setInCall(true);
    toast.success("Joined consultation call room.");
  };

  const handleEndCall = () => {
    setInCall(false);
    toast.info("Consultation call ended.");
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newMsg: ChatMessage = {
      sender: "doctor",
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([...messages, newMsg]);
    setChatInput("");

    // Simulate patient automated reply after 2 seconds
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: "patient",
          text: "Yes, I took it this morning with some food as instructed.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 2000);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mt-6 pb-20">
      {/* LEFT COLUMN: Call Console */}
      <div className="col-span-1 xl:col-span-3 space-y-6">
        <Card className="card overflow-hidden shadow-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white">
          <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center">
            {inCall ? (
              <>
                {/* Main Remote View (Patient) */}
                {videoActive ? (
                  <img
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=60"
                    alt="Patient Stream"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-2xl bg-purple-600 text-white">JS</AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-semibold text-slate-400">Jane Smith (Video Off)</p>
                  </div>
                )}

                {/* Picture in Picture (Doctor Feed) */}
                <div className="absolute right-4 bottom-4 w-40 aspect-video rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shadow-md">
                  <img
                    src="https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=60"
                    alt="Doctor Stream"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Overlaid badges */}
                <div className="absolute left-4 top-4 flex items-center gap-2">
                  <Badge className="bg-red-650 text-white hover:bg-red-650 animate-pulse border-none">
                    LIVE
                  </Badge>
                  <Badge variant="secondary" className="bg-black/50 border-none text-white backdrop-blur-sm">
                    Jane Smith (Patient)
                  </Badge>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 text-center p-8">
                <div className="p-4 bg-slate-850 rounded-full text-slate-400">
                  <Video size={48} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Consultation Call Chamber</h3>
                  <p className="text-sm text-slate-400 max-w-sm mt-1">
                    Connect securely with patients via peer-to-peer video conference.
                  </p>
                </div>
                <Button onClick={handleStartCall} className="bg-blue-650 hover:bg-blue-750 text-white font-bold px-6">
                  Start Consultation
                </Button>
              </div>
            )}
          </div>

          {/* Call Controls Bar */}
          {inCall && (
            <div className="p-4 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  size="icon"
                  variant={micActive ? "secondary" : "destructive"}
                  onClick={() => setMicActive(!micActive)}
                  className="rounded-full h-10 w-10"
                >
                  {micActive ? <Mic size={18} /> : <MicOff size={18} />}
                </Button>
                <Button
                  size="icon"
                  variant={videoActive ? "secondary" : "destructive"}
                  onClick={() => setVideoActive(!videoActive)}
                  className="rounded-full h-10 w-10"
                >
                  {videoActive ? <Video size={18} /> : <VideoOff size={18} />}
                </Button>
              </div>
              <Button onClick={handleEndCall} variant="destructive" className="gap-2 font-bold bg-red-600 hover:bg-red-700">
                <PhoneOff size={16} /> Disconnect
              </Button>
            </div>
          )}
        </Card>

        {/* Call Appointments List */}
        <Card className="card shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="text-blue-500" size={18} /> Schedule & Virtual Appointments
            </CardTitle>
            <CardDescription>
              Your virtual telehealth appointments scheduled for today.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 border-t">
            <div className="divide-y">
              <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-purple-100 text-purple-700 font-bold">JS</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-sm font-bold">Jane Smith</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock size={12} /> 10:15 AM - 10:45 AM (30 mins)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    Active
                  </Badge>
                  <Button size="sm" variant="ghost" className="text-xs gap-1">
                    Details <ExternalLink size={12} />
                  </Button>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">WJ</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-sm font-bold">William Johnson</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock size={12} /> 11:30 AM - 12:00 PM
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-slate-105 text-slate-600">
                    Upcoming
                  </Badge>
                  <Button size="sm" variant="ghost" className="text-xs gap-1" disabled>
                    Details <ExternalLink size={12} />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT COLUMN: Chat & Context Panel */}
      <div className="col-span-1 space-y-6">
        {/* Chat window */}
        <Card className="card shadow-sm rounded-xl flex flex-col h-[400px] xl:h-[450px]">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <MessageSquare size={16} className="text-blue-500" /> Session Chatroom
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <ScrollArea className="flex-1 p-4 space-y-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex flex-col max-w-[80%] mb-4 ${
                    m.sender === "doctor" ? "ml-auto items-end" : "mr-auto items-start"
                  }`}
                >
                  <div
                    className={`p-3 rounded-2xl text-xs ${
                      m.sender === "doctor"
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none"
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[9px] text-slate-400 font-medium mt-1">
                    {m.time}
                  </span>
                </div>
              ))}
            </ScrollArea>

            {/* Input field */}
            <form onSubmit={handleSendMessage} className="p-3 border-t flex gap-2">
              <Input
                placeholder="Type message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="text-xs h-9"
                disabled={!inCall}
              />
              <Button type="submit" size="icon" className="h-9 w-9 bg-blue-600 hover:bg-blue-700" disabled={!inCall}>
                <Send size={14} />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Patient contextual clinical panel */}
        <Card className="card shadow-sm rounded-xl">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <User size={16} className="text-purple-500" /> Medical Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Active Patient</span>
              <h4 className="font-bold text-sm">Jane Smith</h4>
              <p className="text-slate-500">28 years old • Female • O+ Blood</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Active In-patient Reason</span>
              <p className="font-medium text-slate-800 dark:text-slate-200">Mitral Valve Prolapse Checkup</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Active Prescriptions</span>
              <p className="font-semibold text-blue-650 dark:text-blue-400">Amoxicillin 500mg • Atorvastatin 20mg</p>
            </div>

            <div className="space-y-1.5 pt-2 border-t">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Allergy Profile</span>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px]">
                  Penicillin
                </Badge>
                <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 text-[10px]">
                  Sulfa Drugs
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
