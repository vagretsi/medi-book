import { PrismaClient } from "@prisma/client";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { Calendar, LogOut, User, Phone, Clock } from "lucide-react";
import BookingManager from "@/components/BookingManager";
import { logout } from "./actions";

export const dynamic = "force-dynamic";
const prisma = new PrismaClient();

export default async function SecretaryDashboard() {
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
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-center bg-slate-800/50 backdrop-blur-md p-6 rounded-3xl border border-slate-700 shadow-2xl">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">MediBook</h1>
            <p className="text-slate-400 text-sm font-medium">Πίνακας Ελέγχου Γραμματείας</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-blue-400 font-mono text-lg font-bold capitalize">
              {format(new Date(), "EEEE, d MMMM yyyy", { locale: el })}
            </p>
            <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">Live Status</p>
          </div>
          
          <form action={logout}>
            <button 
              type="submit" 
              className="group flex items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300"
            >
              <LogOut className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              Έξοδος
            </button>
          </form>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {resources.map((resource) => (
          <div 
            key={resource.id} 
            className="bg-slate-800/40 rounded-3xl border border-slate-700/50 shadow-xl overflow-hidden flex flex-col hover:border-slate-600 transition-colors"
          >
            {/* Resource Title */}
            <div className={`p-6 border-b border-slate-700 flex justify-between items-center ${
              resource.type === 'MEDICAL' ? 'bg-blue-500/5' : 'bg-purple-500/5'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full animate-pulse ${
                  resource.type === 'MEDICAL' ? 'bg-blue-500' : 'bg-purple-500'
                }`} />
                <h2 className="text-xl font-bold text-white uppercase tracking-tight">{resource.name}</h2>
              </div>
              <span className="text-[10px] font-black bg-slate-700 text-slate-300 px-2 py-1 rounded-md uppercase">
                {resource.type}
              </span>
            </div>

            {/* Appointments List Area */}
            <div className="p-6 bg-slate-900/20 flex-1">
              {resource.appointments.length > 0 ? (
                <BookingManager appointments={resource.appointments} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <Clock className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm italic">Δεν υπάρχουν προγραμματισμένα ραντεβού</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </main>

      <footer className="max-w-7xl mx-auto mt-12 text-center text-slate-600 text-[10px] uppercase tracking-[0.2em]">
        Designed for Excellence • MediBook Pro v1.0
      </footer>
    </div>
  );
}