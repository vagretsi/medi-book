const businessTimeFormatter = new Intl.DateTimeFormat('el-GR', {
  timeZone: 'Europe/Athens',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export function formatBusinessTime(date: Date | string) {
  return businessTimeFormatter.format(new Date(date))
}

const businessDateFormatter = new Intl.DateTimeFormat('el-GR', {
  timeZone: 'Europe/Athens', day: 'numeric', month: 'short', year: 'numeric',
})
export function formatBusinessDate(date: Date | string) {
  return businessDateFormatter.format(new Date(date))
}

export function businessDateKey(date: Date | string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Athens', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(date))
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}
