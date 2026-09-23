import { z } from "zod"

import { isValidSlug } from "../tenant/host"

export const onboardSchema = z.object({
  displayName: z.string().trim().min(2, "Enter your dealership name.").max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Use at least 2 characters.")
    .refine(isValidSlug, "Use 2-40 letters, numbers or hyphens. This name is not available."),
  city: z.string().trim().min(2, "Enter your city.").max(60),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^\+?[0-9]{10,13}$/, "Enter a valid phone number.")),
})

export type OnboardInput = z.infer<typeof onboardSchema>
