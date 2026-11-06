import { SimInputDelta } from "./Types";

export class InputLogger {
  private deltas: SimInputDelta[] = [];
  private lastDx: number = 0;
  private lastDy: number = 0;
  private lastAngle: number = 0;

  /**
   * Records movement input delta only when directional state or aim changes.
   */
  public recordInput(tick: number, dx: number, dy: number, angle?: number): void {
    const angleChanged = angle !== undefined && Math.abs(angle - this.lastAngle) > 0.05;
    if (dx !== this.lastDx || dy !== this.lastDy || angleChanged) {
      this.lastDx = dx;
      this.lastDy = dy;
      if (angle !== undefined) this.lastAngle = angle;

      this.deltas.push({
        tick,
        dx,
        dy,
        angle: angle !== undefined ? Math.round(angle * 100) / 100 : undefined,
      });
    }
  }

  public getDeltas(): readonly SimInputDelta[] {
    return this.deltas;
  }

  /**
   * Compresses input delta log to a compact JSON string.
   */
  public exportLog(): string {
    return JSON.stringify(this.deltas);
  }

  /**
   * Imports input delta log from string.
   */
  public static importLog(jsonStr: string): SimInputDelta[] {
    try {
      return JSON.parse(jsonStr) as SimInputDelta[];
    } catch {
      return [];
    }
  }
}
