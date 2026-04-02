import type { BaseAction, ActionResponse, ActionSchema } from "./baseAction"
import { z } from "zod"

export interface AgentContext {
  apiEndpoint: string
  apiKey: string
}

/** Central Agent: registers actions and routes invocations */
export class Agent {
  private readonly actions = new Map<string, BaseAction<any, any, AgentContext>>()

  /** Register an action (throws if the id already exists) */
  register<S extends ActionSchema, R>(action: BaseAction<S, R, AgentContext>): void {
    if (this.actions.has(action.id)) {
      throw new Error(`Action "${action.id}" is already registered`)
    }
    this.actions.set(action.id, action)
  }

  /** Unregister an action by id */
  unregister(id: string): boolean {
    return this.actions.delete(id)
  }

  /** List all registered action ids */
  list(): string[] {
    return Array.from(this.actions.keys())
  }

  /** Invoke an action by id with runtime payload validation against its Zod schema */
  async invoke<S extends ActionSchema, R>(
    actionId: string,
    payload: unknown,
    ctx: AgentContext
  ): Promise<ActionResponse<R>> {
    const action = this.actions.get(actionId) as BaseAction<S, R, AgentContext> | undefined
    if (!action) throw new Error(`Unknown action "${actionId}"`)

    // Validate payload if the action exposes an input schema
    const schema = (action as { input?: z.ZodTypeAny }).input
    const validatedPayload = schema ? schema.parse(payload) : (payload as z.infer<S>)

    return action.execute({ payload: validatedPayload, context: ctx }) as Promise<ActionResponse<R>>
  }
}
