import { PrismaClient } from "@prisma/client";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { Calendar, LogOut } from "lucide-react";
import BookingManager from "@/components/BookingManager";
import { logout } from "./actions";

export const dynamic = "force-dynamic";
const prisma = new PrismaClient();

export default async function Dashboard() {
  const resources = await prisma.resource.findMany({
    orderBy: { id: 'asc' },
    include: {
      appointments: {
        where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        orderBy: { date: "asc" },
      },
    },
  });

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8">
      {/* HEADER */}
      <header className="max-w-[1600px] mx-auto mb-10 flex flex-col md:flex-row justify-between items-center bg-slate-800/40 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">MediBook</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Live Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <p className="text-blue-400 font-mono text-lg font-bold capitalize hidden md:block">
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: el })}
          </p>
          <form action={logout}>
            <button type="submit" className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-5 py-2.5 rounded-xl text-sm font-bold transition-all">
              <LogOut className="w-4 h-4" /> Έξοδος
            </button>
          </form>
        </div>
      </header>

      {/* COLUMNS GRID */}
      <main className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
        {resources.map((resource) => (
          <div key={resource.id} className="bg-slate-800/30 rounded-[32px] border border-slate-700/50 shadow-xl overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full animate-pulse ${resource.type === 'MEDICAL' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                <h2 className="text-xl font-bold text-white uppercase tracking-tighter">{resource.name}</h2>
              </div>
              <span className="text-[10px] font-black bg-slate-900 text-slate-500 px-2 py-1 rounded border border-slate-700 uppercase">
                {resource.type}
              </span>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto">
              <BookingManager appointments={resource.appointments} />
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}