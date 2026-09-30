'use client'
import { useEffect, useState } from 'react'
import { getDayAppointments } from '@/app/actions'
import type { AppointmentSlot } from '@/lib/calendar-types'

/** Fetch date changes without remounting the form or replacing its draft fields. */
export function useCalendarDaySlots(date: string, resourceId: number | undefined, initialDate: string, initialSlots: AppointmentSlot[]) {
  const [result, setResult] = useState<{ key: string; slots: AppointmentSlot[]; error: string } | null>(null)
  const [retry, setRetry] = useState(0)
  const key = `${resourceId}:${date}:${retry}`
  const needsFetch = Boolean(resourceId && date && date !== initialDate)
  useEffect(() => {
    if (!needsFetch) return
    let active = true
    getDayAppointments(`${date}T12:00:00Z`).then(resources => {
      if (!active) return
      const resource = resources.find(item => item.id === resourceId && item.canWrite)
      setResult({ key, slots: resource?.appointments ?? [], error: resource ? '' : 'Δεν υπάρχει δικαίωμα επεξεργασίας.' })
    }).catch(() => {
      if (active) setResult({ key, slots: [], error: 'Δεν ήταν δυνατή η φόρτωση των ωρών.' })
    })
    return () => { active = false }
  }, [date, resourceId, key, needsFetch])
  return {
    slots: !date ? [] : needsFetch ? (result?.key === key ? result.slots : []) : initialSlots,
    loading: needsFetch && result?.key !== key,
    error: needsFetch && result?.key === key ? result.error : '',
    retry: () => setRetry(value => value + 1),
  }
}
