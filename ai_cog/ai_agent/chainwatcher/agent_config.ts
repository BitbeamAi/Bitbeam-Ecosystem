export interface AgentCapabilities {
  readonly canAnswerProtocolQuestions: boolean
  readonly canAnswerTokenQuestions: boolean
  readonly canDescribeTooling: boolean
  readonly canReportEcosystemNews: boolean
}

export interface AgentFlags {
  readonly requiresExactInvocation: boolean
  readonly noAdditionalCommentary: boolean
}

/** Handy keys */
export type AgentCapabilityKey = keyof AgentCapabilities
export type AgentFlagKey = keyof AgentFlags

export const SOLANA_AGENT_CAPABILITIES: Readonly<AgentCapabilities> = Object.freeze({
  canAnswerProtocolQuestions: true,
  canAnswerTokenQuestions: true,
  canDescribeTooling: true,
  canReportEcosystemNews: true,
})

export const SOLANA_AGENT_FLAGS: Readonly<AgentFlags> = Object.freeze({
  requiresExactInvocation: true,
  noAdditionalCommentary: true,
})

/** Small helpers */
export const hasCapability = (caps: AgentCapabilities, key: AgentCapabilityKey): boolean =>
  !!caps[key]

export const isStrictMode = (flags: AgentFlags): boolean =>
  flags.requiresExactInvocation && flags.noAdditionalCommentary
