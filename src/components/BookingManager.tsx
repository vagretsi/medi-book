import { PrismaClient } from "@prisma/client";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { Calendar } from "lucide-react";
import BookingManager from "@/components/BookingManager";
import BookingModal from './BookingModal'

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
    <div className="min-h-screen bg-slate-50 p-6">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-lg text-white"><Calendar className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">MediBook</h1>
            <p className="text-slate-500 text-sm">Πίνακας Ελέγχου</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-xl text-blue-600 font-bold">
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: el })}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {resources.map((resource) => (
          <div key={resource.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className={`p-5 border-b flex justify-between items-center ${resource.type === 'MEDICAL' ? 'bg-blue-50' : 'bg-rose-50'}`}>
              <h2 className={`font-bold text-lg ${resource.type === 'MEDICAL' ? 'text-blue-700' : 'text-rose-700'}`}>{resource.name}</h2>
            </div>
            <div className="p-4 bg-slate-50/50 flex-1">
              <BookingManager appointments={resource.appointments} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}