function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required (see apps/agent/.env.example)`);
  }
  return value;
}

export const config = {
  payerAccountId: requireEnv("HEDERA_PAYER_ACCOUNT_ID"),
  payerPrivateKey: requireEnv("HEDERA_PAYER_PRIVATE_KEY"),
  maxTotalTinybars: Number(process.env.MAX_TOTAL_TINYBARS ?? 5_000_000),
  maxPricePerCallTinybars: Number(process.env.MAX_PRICE_PER_CALL_TINYBARS ?? 1_000_000),
  maxCalls: Number(process.env.MAX_CALLS ?? 5),
};

export class Budget {
  private spentTinybars = 0;
  private calls = 0;

  constructor(
    private readonly maxTotalTinybars: number,
    private readonly maxPricePerCallTinybars: number,
    private readonly maxCalls: number,
  ) {}

  /** Throws if paying priceTinybars would violate a guardrail. Call before every payment. */
  assertCanSpend(priceTinybars: number): void {
    if (this.calls >= this.maxCalls) {
      throw new Error(`MAX_CALLS reached (${this.maxCalls}) — refusing further payment`);
    }
    if (priceTinybars > this.maxPricePerCallTinybars) {
      throw new Error(
        `quote ${priceTinybars} tinybars exceeds MAX_PRICE_PER_CALL_TINYBARS (${this.maxPricePerCallTinybars})`,
      );
    }
    if (this.spentTinybars + priceTinybars > this.maxTotalTinybars) {
      throw new Error(
        `paying ${priceTinybars} tinybars would exceed MAX_TOTAL_TINYBARS ` +
          `(${this.maxTotalTinybars}); already spent ${this.spentTinybars}`,
      );
    }
  }

  recordSpend(priceTinybars: number): void {
    this.spentTinybars += priceTinybars;
    this.calls += 1;
  }

  get totalSpentTinybars(): number {
    return this.spentTinybars;
  }

  get callsMade(): number {
    return this.calls;
  }

  get remainingTinybars(): number {
    return this.maxTotalTinybars - this.spentTinybars;
  }
}
