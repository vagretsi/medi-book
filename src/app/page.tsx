import { PrismaClient } from "@prisma/client";
import { Calendar, LogOut } from "lucide-react";
import BookingManager from "@/components/BookingManager";
import { logout } from "./actions";
import DateNavigator from "@/components/DateNavigator";

export const dynamic = "force-dynamic";
const prisma = new PrismaClient();

export default async function Dashboard({ searchParams }: { searchParams: { date?: string } }) {
  // 1. Υπολογισμός της επιλεγμένης ημερομηνίας
  const dateStr = (await searchParams)?.date || new Date().toISOString();
  const selectedDate = new Date(dateStr);
  
  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

  // 2. Φέρνουμε τα δεδομένα MONO για αυτή τη μέρα
  const resources = await prisma.resource.findMany({
    orderBy: { id: 'asc' },
    include: {
      appointments: {
        where: { 
          date: { 
            gte: startOfDay,
            lte: endOfDay
          } 
        },
        orderBy: { date: "asc" },
      },
    },
  });

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8">
      {/* HEADER */}
      <header className="max-w-[1600px] mx-auto mb-8 flex flex-col md:flex-row justify-between items-center bg-slate-800/40 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50 shadow-2xl gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">MediBook</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Appointment Manager</p>
          </div>
        </div>

        {/* ΕΔΩ ΜΠΗΚΕ ΤΟ ΗΜΕΡΟΛΟΓΙΟ */}
        <DateNavigator />

        <div className="flex items-center gap-6">
          <form action={logout}>
            <button type="submit" className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-5 py-2.5 rounded-xl text-sm font-bold transition-all">
              <LogOut className="w-4 h-4" /> Έξοδος
            </button>
          </form>
        </div>
      </header>

      {/* COLUMNS GRID */}
      <main className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {resources.map((resource) => (
          <div key={resource.id} className="bg-slate-800/30 rounded-[32px] border border-slate-700/50 shadow-xl overflow-hidden flex flex-col h-full min-h-[600px]">
            <div className={`p-6 border-b border-slate-700/50 flex justify-between items-center ${resource.type === 'MEDICAL' ? 'bg-blue-500/5' : 'bg-purple-500/5'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full animate-pulse ${resource.type === 'MEDICAL' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                <h2 className="text-xl font-bold text-white uppercase tracking-tighter">{resource.name}</h2>
              </div>
              <span className="text-[10px] font-black bg-slate-900 text-slate-500 px-2 py-1 rounded border border-slate-700 uppercase">
                {resource.type}
              </span>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto max-h-[calc(100vh-250px)]">
              {resource.appointments.length > 0 ? (
                 <BookingManager appointments={resource.appointments} />
              ) : (
                <div className="text-center py-20 text-slate-600 italic">
                  Δεν έχουν δημιουργηθεί slots για αυτή τη μέρα.<br/>
                  <span className="text-xs">Ζητήστε από τον Admin να τρέξει το seed.</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}