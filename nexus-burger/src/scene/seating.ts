export const tableYaw = -0.16
// Keep the invitation in the foreground after the table's rotation.
export const guestAngle = -tableYaw
export function memberSeatAngle(index: number, count: number) {
  return guestAngle + ((index + 1) / (count + 1)) * Math.PI * 2
}
