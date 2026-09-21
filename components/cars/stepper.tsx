import { Progress } from "@/components/ui/progress"
import { copy } from "@/lib/copy"

export type Step = "plate" | "car" | "photos" | "price" | "done"
const ORDER: Exclude<Step, "done">[] = ["plate", "car", "photos", "price"]

export function Stepper({ step }: { step: Step }) {
  const t = copy.admin.addCar.steps
  const idx = step === "done" ? ORDER.length : ORDER.indexOf(step)
  return (
    <div className="flex flex-col gap-2" aria-label="Progress">
      <Progress value={(idx / ORDER.length) * 100} />
      <ol className="flex justify-between text-xs">
        {ORDER.map((s, i) => (
          <li key={s} aria-current={s === step ? "step" : undefined} className={i <= idx ? "font-medium text-foreground" : "text-muted-foreground"}>
            {i + 1}. {t[s]}
          </li>
        ))}
      </ol>
    </div>
  )
}
