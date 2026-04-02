/**
 * Task execution engine: registers, queues, and runs async tasks by type.
 */
type Handler<T = any, R = any> = (params: T) => Promise<R>

interface Task<T = any> {
  id: string
  type: string
  params: T
}

interface TaskResult<R = any> {
  id: string
  result?: R
  error?: string
  executedAt: number
  durationMs: number
}

export class ExecutionEngine {
  private handlers: Record<string, Handler> = {}
  private queue: Task[] = []

  /**
   * Register a handler function for a given task type.
   */
  register(type: string, handler: Handler): void {
    this.handlers[type] = handler
  }

  /**
   * Add a task to the execution queue.
   */
  enqueue<T>(id: string, type: string, params: T): void {
    if (!this.handlers[type]) throw new Error(`No handler registered for type: ${type}`)
    this.queue.push({ id, type, params })
  }

  /**
   * Execute all queued tasks sequentially and return results.
   */
  async runAll(): Promise<TaskResult[]> {
    const results: TaskResult[] = []
    while (this.queue.length) {
      const task = this.queue.shift()!
      const start = Date.now()
      try {
        const data = await this.handlers[task.type](task.params)
        results.push({
          id: task.id,
          result: data,
          executedAt: start,
          durationMs: Date.now() - start,
        })
      } catch (err: any) {
        results.push({
          id: task.id,
          error: err?.message ?? String(err),
          executedAt: start,
          durationMs: Date.now() - start,
        })
      }
    }
    return results
  }

  /**
   * Clear all queued tasks without running them.
   */
  clear(): void {
    this.queue = []
  }

  /**
   * Get number of pending tasks.
   */
  count(): number {
    return this.queue.length
  }
}
