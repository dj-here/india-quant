/**
 * Mulberry32 — Deterministic 32-bit Pseudo-Random Number Generator
 * Produces high-quality uniform random distributions from a single uint32 seed.
 */

export class Mulberry32 {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Returns uniform float in range [0, 1) */
  public next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns uniform integer in range [min, max] inclusive */
  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Returns uniform float in range [min, max) */
  public nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Returns boolean with probability p */
  public nextBool(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  /** Selects random item from array */
  public pick<T>(items: readonly T[]): T {
    const idx = Math.floor(this.next() * items.length);
    return items[idx];
  }

  /** Shuffles array in-place deterministically using Fisher-Yates */
  public shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  }

  public getState(): number {
    return this.state;
  }

  public setState(state: number): void {
    this.state = state >>> 0;
  }
}

/** String hasher to generate a 32-bit seed from a string (e.g. date) */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash >>> 0;
}
