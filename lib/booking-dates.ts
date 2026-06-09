export function expandBookingDates(
  bookings: { start_date: string; end_date: string }[]
): string[] {
  const dates: string[] = []
  for (const { start_date, end_date } of bookings) {
    const [sy, sm, sd] = start_date.split('-').map(Number)
    const [ey, em, ed] = end_date.split('-').map(Number)
    const cur = new Date(sy, sm - 1, sd)
    const end = new Date(ey, em - 1, ed)
    while (cur <= end) {
      dates.push(
        `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
      )
      cur.setDate(cur.getDate() + 1)
    }
  }
  return [...new Set(dates)]
}
