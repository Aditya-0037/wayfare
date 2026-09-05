# discovery (not yet built)

Planned for M5 (Bazantic discovery path). Registers each provider as an
x402/MPP Gateway on bazantic.com and writes a Recipe per provider. The agent
should consume providers through the Bazantic MCP server, not direct HTTP.
Also owns the A/B artifact: same task/model/settings, Recipe present vs.
absent, logging success rate / token spend / malformed-call rate over N runs.
