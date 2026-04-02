import type { TaskFormInput } from "./taskFormSchemas"
import { TaskFormSchema } from "./taskFormSchemas"

/**
 * Processes a Typeform webhook payload to schedule a new task.
 */
export async function handleTypeformSubmission(
  raw: unknown
): Promise<{ success: boolean; message: string; id?: string }> {
  const parsed = TaskFormSchema.safeParse(raw)
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => i.message).join("; ")
    return { success: false, message: `Validation error: ${issues}` }
  }

  const data: TaskFormInput = parsed.data
  const { taskName, taskType, parameters, scheduleCron } = data

  // Basic cron validation: 5-part or 6-part expressions (very loose check)
  const cronLike = /^(\S+\s+){4,5}\S+$/
  if (scheduleCron && !cronLike.test(scheduleCron.trim())) {
    return { success: false, message: "Invalid cron expression format" }
  }

  // Normalize task name
  const name = taskName.trim().slice(0, 120)

  // Generate task ID
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

  // Here you would persist and schedule the task using your scheduler of choice
  // e.g., save { id, name, taskType, parameters, scheduleCron } to a DB and enqueue

  return {
    success: true,
    message: `Task "${name}" scheduled`,
    id,
  }
}
