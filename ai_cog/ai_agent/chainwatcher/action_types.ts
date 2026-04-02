import { z } from "zod"

/** Zod schema used by actions */
export type ActionSchema = z.ZodObject<z.ZodRawShape>

/** Generic action response */
export interface ActionResponse<T> {
  notice: string
  data?: T
}

/** Helper to infer input type from a schema */
export type InferInput<S extends ActionSchema> = z.infer<S>

/** Execute-call argument shape */
export interface ActionExecuteArgs<S extends ActionSchema, Ctx> {
  payload: InferInput<S>
  context: Ctx
}

/** Base action contract */
export interface BaseAction<S extends ActionSchema, R, Ctx = unknown> {
  /** Unique action identifier */
  readonly id: string
  /** Short human-readable summary */
  readonly summary: string
  /** Zod input schema */
  readonly input: S
  /** Execute action with validated payload + context */
  execute(args: ActionExecuteArgs<S, Ctx>): Promise<ActionResponse<R>>
}
