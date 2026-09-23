/** A single row in the dealer's live listing, ready for the filter sidebar and card grid. */
export type ListingItem = {
  id: string
  slug: string
  title: string
  variantLabel: string | null
  model: string | null
  fuel: string | null
  transmission: string | null
  ownerCount: number | null
  kmDriven: number | null
  askingPrice: number | null
  emiPerMonth: number | null
  regPrefix: string | null
  reasonsToBuy: string[]
  images: string[]
  year: number | null
  bodyType: string | null
  colour: string | null
  rto: string | null
  seats: string | null
  warrantyAvailable: boolean
  returnAssurance: boolean
  features: string[]
  safetyFeatures: string[]
}

export type CarFilters = {
  q: string
  models: string[]
  fuels: string[]
  transmissions: string[]
  minPrice: number | null
  maxPrice: number | null
  minKm: number | null
  maxKm: number | null
  minYear: number | null
  maxYear: number | null
  bodyTypes: string[]
  colours: string[]
  rtos: string[]
  owners: number[]
  seats: string[]
  features: string[]
  safetyFeatures: string[]
  warranty: boolean
  returnAssurance: boolean
  discounts: string[]
}

const list = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v : v ? [v] : []
const num = (v: string | string[] | undefined) => {
  const n = Number(Array.isArray(v) ? v[0] : v)
  return Number.isFinite(n) ? n : null
}
const numbers = (v: string | string[] | undefined) =>
  list(v).map(Number).filter(Number.isFinite)
const flag = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v) === "1"

export function parseCarFilters(
  searchParams: Record<string, string | string[] | undefined>
): CarFilters {
  return {
    q:
      (Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q)
        ?.trim()
        .toLowerCase() ?? "",
    models: list(searchParams.model),
    fuels: list(searchParams.fuel),
    transmissions: list(searchParams.transmission),
    minPrice: num(searchParams.minPrice),
    maxPrice: num(searchParams.maxPrice),
    minKm: num(searchParams.minKm),
    maxKm: num(searchParams.maxKm),
    minYear: num(searchParams.minYear),
    maxYear: num(searchParams.maxYear),
    bodyTypes: list(searchParams.bodyType),
    colours: list(searchParams.colour),
    rtos: list(searchParams.rto),
    owners: numbers(searchParams.owner),
    seats: list(searchParams.seats),
    features: list(searchParams.feature),
    safetyFeatures: list(searchParams.safety),
    warranty: flag(searchParams.warranty),
    returnAssurance: flag(searchParams.returnAssurance),
    discounts: list(searchParams.discount),
  }
}

export function filterListing(
  listing: ListingItem[],
  filters: CarFilters
): ListingItem[] {
  return listing.filter((item) => {
    if (filters.q && !item.title.toLowerCase().includes(filters.q)) return false
    if (
      filters.models.length &&
      (!item.model || !filters.models.includes(item.model))
    )
      return false
    if (
      filters.fuels.length &&
      (!item.fuel || !filters.fuels.includes(item.fuel))
    )
      return false
    if (
      filters.transmissions.length &&
      (!item.transmission || !filters.transmissions.includes(item.transmission))
    )
      return false
    if (filters.minPrice != null && (item.askingPrice ?? 0) < filters.minPrice)
      return false
    if (
      filters.maxPrice != null &&
      (item.askingPrice ?? Infinity) > filters.maxPrice
    )
      return false
    if (filters.minKm != null && (item.kmDriven ?? 0) < filters.minKm)
      return false
    if (filters.maxKm != null && (item.kmDriven ?? Infinity) > filters.maxKm)
      return false
    if (filters.minYear != null && (item.year ?? 0) < filters.minYear)
      return false
    if (filters.maxYear != null && (item.year ?? Infinity) > filters.maxYear)
      return false
    if (
      filters.bodyTypes.length &&
      (!item.bodyType || !filters.bodyTypes.includes(item.bodyType))
    )
      return false
    if (
      filters.colours.length &&
      (!item.colour || !filters.colours.includes(item.colour))
    )
      return false
    if (filters.rtos.length && (!item.rto || !filters.rtos.includes(item.rto)))
      return false
    if (
      filters.owners.length &&
      (!item.ownerCount || !filters.owners.includes(item.ownerCount))
    )
      return false
    if (
      filters.seats.length &&
      (!item.seats || !filters.seats.includes(item.seats))
    )
      return false
    if (
      filters.features.length &&
      !filters.features.every((feature) => item.features.includes(feature))
    )
      return false
    if (
      filters.safetyFeatures.length &&
      !filters.safetyFeatures.every((feature) =>
        item.safetyFeatures.includes(feature)
      )
    )
      return false
    if (filters.warranty && !item.warrantyAvailable) return false
    if (filters.returnAssurance && !item.returnAssurance) return false
    return true
  })
}

/** Counted facet options for the sidebar, built from the unfiltered listing so counts don't collapse as filters narrow it. */
export function facetOptions(listing: ListingItem[]) {
  const count = (values: (string | null)[]) => {
    const counts = new Map<string, number>()
    for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1)
    return [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value))
  }
  const prices = listing
    .map((i) => i.askingPrice)
    .filter((p): p is number => p != null)
  const kms = listing
    .map((i) => i.kmDriven)
    .filter((value): value is number => value != null)
  const years = listing
    .map((i) => i.year)
    .filter((value): value is number => value != null)
  return {
    models: count(listing.map((i) => i.model)),
    fuels: count(listing.map((i) => i.fuel)),
    transmissions: count(listing.map((i) => i.transmission)),
    priceBounds: prices.length
      ? { min: Math.min(...prices), max: Math.max(...prices) }
      : null,
    kmBounds: kms.length
      ? { min: Math.min(...kms), max: Math.max(...kms) }
      : null,
    yearBounds: years.length
      ? { min: Math.min(...years), max: Math.max(...years) }
      : null,
    bodyTypes: count(listing.map((item) => item.bodyType)),
    colours: count(listing.map((item) => item.colour)),
    rtos: count(listing.map((item) => item.rto)),
    owners: count(
      listing.map((item) => (item.ownerCount ? `${item.ownerCount}` : null))
    ),
    seats: count(listing.map((item) => item.seats)),
    features: count(listing.flatMap((item) => item.features)),
    safetyFeatures: count(listing.flatMap((item) => item.safetyFeatures)),
    warrantyCount: listing.filter((item) => item.warrantyAvailable).length,
    returnAssuranceCount: listing.filter((item) => item.returnAssurance).length,
  }
}
