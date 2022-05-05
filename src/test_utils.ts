import { Ratelimit } from "./ratelimiter.ts";

type Metrics = {
  requests: number;
  success: number;
  rejected: number;
};
export class TestHarness {
  /**
   * Used as prefix for redis keys
   */
  public readonly id: string;

  private readonly ratelimit: Ratelimit;
  public metrics: Metrics;

  constructor(ratelimit: Ratelimit) {
    this.ratelimit = ratelimit;
    this.id = crypto.randomUUID();
    this.metrics = {
      requests: 0,
      success: 0,
      rejected: 0,
    };
  }

  /**
   * @param rate - req per second
   * @param duration - duration in seconds
   */
  public async attack(rate: number, duration: number): Promise<void> {
    const promises: Promise<{ success: boolean }>[] = [];

    for (let i = 0; i < duration; i++) {
      for (let r = 0; r < rate; r++) {
        this.metrics.requests++;
        promises.push(this.ratelimit.limit(this.id));
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    await Promise.all(
      promises.map(async (p) => {
        const { success } = await p;
        if (success) {
          this.metrics.success++;
        } else {
          this.metrics.rejected++;
        }
      }),
    );
  }
}