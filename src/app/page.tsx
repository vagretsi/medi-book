import { PrismaClient } from "@prisma/client";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import BookingManager from "@/components/BookingManager";

const prisma = new PrismaClient();

export default async function Dashboard() {
  const resources = await prisma.resource.findMany({
    include: { appointments: { orderBy: { date: "asc" } } },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-slate-800 border-b pb-4">MediBook Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {resources.map(r => (
          <div key={r.id} className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h2 className="text-xl font-bold mb-4 text-blue-700">{r.name}</h2>
            <BookingManager appointments={r.appointments} />
          </div>
        ))}
      </div>
    </div>
  );
}