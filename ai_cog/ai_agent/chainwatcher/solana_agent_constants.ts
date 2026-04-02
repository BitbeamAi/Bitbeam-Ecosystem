/** Stable identifier for the Solana Knowledge Agent */
export const SOLANA_KNOWLEDGE_AGENT_ID = "solana-knowledge-agent" as const

/** Literal type of the agent ID */
export type SolanaKnowledgeAgentId = typeof SOLANA_KNOWLEDGE_AGENT_ID

/** Human-friendly display name */
export const SOLANA_KNOWLEDGE_AGENT_NAME = "Solana Knowledge Agent"

/** Minimal validator for agent IDs (kept liberal but predictable) */
export function isValidSolanaAgentId(id: string): boolean {
  return id === SOLANA_KNOWLEDGE_AGENT_ID || /^solana-[a-z-]+$/.test(id)
}
