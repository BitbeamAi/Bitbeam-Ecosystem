import { exec } from "child_process"

/**
 * Execute a shell command and return stdout or throw on error.
 * @param command Shell command to run (e.g., "ls -la")
 * @param timeoutMs Optional timeout in milliseconds
 * @param cwd Optional working directory
 */
export function execCommand(
  command: string,
  timeoutMs: number = 30_000,
  cwd?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = exec(
      command,
      { timeout: timeoutMs, cwd },
      (error, stdout, stderr) => {
        if (error) {
          return reject(new Error(`Command failed: ${stderr || error.message}`))
        }
        if (stderr) {
          console.warn(`Command produced warnings: ${stderr}`)
        }
        resolve(stdout.trim())
      }
    )

    proc.on("exit", (code) => {
      if (code !== 0) {
        console.warn(`Process exited with code ${code}`)
      }
    })
  })
}
