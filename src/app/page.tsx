import DashboardController from "@/components/DashboardController";
import { getDayAppointments, getDayNote } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const today = new Date();
  const todayStr = today.toISOString();
  const [initialResources, initialDayNote] = await Promise.all([
    getDayAppointments(todayStr),
    getDayNote(todayStr),
  ]);

  return (
    <div className="min-h-screen">
        <DashboardController initialData={initialResources} initialDayNote={initialDayNote} />
    </div>
  );
}
