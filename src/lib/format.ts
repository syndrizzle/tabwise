const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
})

export const formatInr = (value: number) => inr.format(value)

// Catalog dates are calendar days ("2026-10-15"), so they are read and
// printed in UTC to stay on the same day in every time zone.
const toDate = (day: string) => new Date(`${day}T00:00:00Z`)

const formatDay = (day: string, month: "long" | "short") =>
  toDate(day).toLocaleDateString("en-IN", {
    day: "numeric",
    month,
    year: "numeric",
    timeZone: "UTC",
  })

export const formatDate = (day: string) => formatDay(day, "long")

export const formatShortDate = (day: string) => formatDay(day, "short")

export const formatDateRange = (first: string, last: string) =>
  first === last
    ? formatDate(last)
    : `${toDate(first).getUTCDate()}–${formatDate(last)}`
