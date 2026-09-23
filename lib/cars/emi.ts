/** Standard reducing-balance EMI formula. Shared by the server-rendered listing cards and the client EMI calculator. */
export function calculateEmi(principal: number, annualRate: number, months: number) {
  if (principal <= 0 || months <= 0) return 0
  const monthlyRate = annualRate / 12 / 100
  if (monthlyRate === 0) return principal / months
  const factor = (1 + monthlyRate) ** months
  return (principal * monthlyRate * factor) / (factor - 1)
}
