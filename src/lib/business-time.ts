const businessTimeFormatter = new Intl.DateTimeFormat('el-GR', {
  timeZone: 'Europe/Athens',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export function formatBusinessTime(date: Date | string) {
  return businessTimeFormatter.format(new Date(date))
}
