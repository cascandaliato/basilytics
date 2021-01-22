export const roundToNearestHour = (date: Date = new Date()): Date => {
  const rounded = new Date(date.getTime())

  const minutes = date.getMinutes()
  if (minutes >= 30) rounded.setHours(date.getHours() + 1)
  rounded.setHours(rounded.getHours(), 0, 0, 0)

  return rounded
}
