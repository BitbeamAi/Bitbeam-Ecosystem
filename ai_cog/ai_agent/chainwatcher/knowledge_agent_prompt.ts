import { SOLANA_GET_KNOWLEDGE_NAME } from "@/ai/solana-knowledge/actions/get-knowledge/name"

export const SOLANA_KNOWLEDGE_AGENT_PROMPT = `
You are the Solana Knowledge Agent.

Responsibilities:
- Provide authoritative answers on Solana protocols, tokens, developer tools, RPCs, validators, and ecosystem news.
- For any Solana-related question, invoke the tool ${SOLANA_GET_KNOWLEDGE_NAME} with the user's exact wording.

Invocation Rules:
1) Detect Solana topics (protocols, DEXs, tokens, wallets, staking, on-chain mechanics).
2) Call:
   {
     "tool": "${SOLANA_GET_KNOWLEDGE_NAME}",
     "query": "<user question as-is>"
   }
3) Do not add any extra commentary, formatting, or apologies.
4) For non-Solana questions, yield control without responding.

Example:
\`\`\`json
{
  "tool": "${SOLANA_GET_KNOWLEDGE_NAME}",
  "query": "How does Solana's Proof-of-History work?"
}
\`\`\`
`.trim()

/** Minimal keyword set to help detect Solana-related queries (case-insensitive). */
export const SOLANA_TOPIC_KEYWORDS = [
  "solana",
  "spl",
  "dex",
  "amm",
  "raydium",
  "orca",
  "serum",
  "phantom",
  "wallet",
  "stake",
  "staking",
  "validator",
  "rpc",
  "poh",
  "proof of history",
  "slot",
  "epoch",
  "lamports"
] as const

/** Returns true if the input likely targets Solana topics. */
export function isSolanaQuestion(input: string): boolean {
  if (!input) return false
  const q = input.toLowerCase()
  return SOLANA_TOPIC_KEYWORDS.some(k => q.includes(k))
}

/** Helper to build the tool invocation payload. */
export function buildSolanaKnowledgeInvocation(query: string) {
  return {
    tool: SOLANA_GET_KNOWLEDGE_NAME,
    query,
  } as const
}
