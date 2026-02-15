import { PrismaClient } from "@prisma/client";
import { format } from "date-fns";
import { el } from "date-fns/locale"; // Για Ελληνικές ημερομηνίες
import { Calendar, User, Phone, Clock, PlusCircle } from "lucide-react";

// Αυτό λέει στο Next.js να ΜΗΝ κρατάει cache, ώστε να βλέπεις πάντα τα φρέσκα δεδομένα
export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export default async function SecretaryDashboard() {
  // 1. Τραβάμε τους Πόρους και τα Ραντεβού τους (από σήμερα και μετά)
  const resources = await prisma.resource.findMany({
    orderBy: { id: 'asc' },
    include: {
      appointments: {
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)), // Από σήμερα
          },
        },
        orderBy: { date: "asc" },
      },
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-lg text-white">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">MediBook Dashboard</h1>
            <p className="text-slate-500 text-sm">Πίνακας Ελέγχου Γραμματείας</p>
          </div>
        </div>
        <div className="text-right mt-4 md:mt-0">
          <p className="font-mono text-xl text-blue-600 font-bold">
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: el })}
          </p>
          <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">ΣΗΜΕΡΑ</span>
        </div>
      </header>

      {/* Grid: Οι δύο κόσμοι (Medical vs Aesthetic) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {resources.map((resource: any) => {
          const isMedical = resource.type === 'MEDICAL';
          const themeColor = isMedical ? 'blue' : 'rose';
          // Tailwind dynamic classes tricks needed usually, but keeping simple here:
          const headerBg = isMedical ? 'bg-blue-50 border-blue-100' : 'bg-rose-50 border-rose-100';
          const titleColor = isMedical ? 'text-blue-700' : 'text-rose-700';
          
          return (
            <div key={resource.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
              
              {/* Κεφαλίδα Πόρου */}
              <div className={`p-5 border-b flex justify-between items-center ${headerBg}`}>
                <div>
                  <h2 className={`font-bold text-lg ${titleColor}`}>{resource.name}</h2>
                  <span className="text-xs font-bold text-slate-500 opacity-70">
                    {isMedical ? '👨‍⚕️ ΙΑΤΡΙΚΟ ΤΜΗΜΑ' : '💅 ΤΜΗΜΑ ΑΙΣΘΗΤΙΚΗΣ'}
                  </span>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${isMedical ? 'bg-blue-200 text-blue-800' : 'bg-rose-200 text-rose-800'}`}>
                  {resource.appointments.length} Ραντεβού
                </div>
              </div>

              {/* Λίστα Ραντεβού */}
              <div className="p-4 space-y-3 flex-1 bg-slate-50/50">
                {resource.appointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                    <Clock className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm italic">Κανένα πρόγραμμα ακόμα.</p>
                  </div>
                ) : (
                  resource.appointments.map((apt) => (
                    <div 
                      key={apt.id} 
                      className={`group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all duration-200 
                        ${apt.status === 'FREE' 
                          ? 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md' 
                          : 'bg-slate-100 border-slate-200 opacity-90'
                        }`}
                    >
                      {/* Αριστερά: Ώρα */}
                      <div className="flex items-center gap-4 mb-3 sm:mb-0">
                        <div className={`font-mono text-xl font-bold ${apt.status === 'FREE' ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                          {format(new Date(apt.date), "HH:mm")}
                        </div>
                        
                        {/* Status Label */}
                        {apt.status === 'FREE' ? (
                          <span className="text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                            ΔΙΑΘΕΣΙΜΟ
                          </span>
                        ) : (
                          <div className="flex flex-col">
                             <div className="flex items-center gap-1 text-slate-800 font-bold text-sm">
                                <User className="w-3 h-3" /> {apt.patientName}
                             </div>
                             <div className="flex items-center gap-1 text-slate-500 text-xs">
                                <Phone className="w-3 h-3" /> {apt.patientTel}
                             </div>
                          </div>
                        )}
                      </div>

                      {/* Δεξιά: Κουμπί Ενέργειας */}
                      <div>
                        {apt.status === 'FREE' ? (
                          <button className="flex items-center gap-1 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-sm">
                            <PlusCircle className="w-3 h-3" /> Κράτηση
                          </button>
                        ) : (
                          <button className="text-xs font-medium text-slate-400 hover:text-red-500 transition-colors">
                            Ακύρωση
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}