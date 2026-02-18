
import { Point } from '../types';

export class PRNG {
  private m = 0x80000000;
  private a = 1103515245;
  private c = 12345;
  private state: number;

  constructor(seed: number) {
    this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
  }

  next(): number {
    this.state = (this.a * this.state + this.c) % this.m;
    return this.state / (this.m - 1);
  }

  between(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

export const distance = (p1: Point, p2: Point) => Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const isIntersecting = (a: Point, b: Point, c: Point, d: Point): boolean => {
  const det = (b.x - a.x) * (d.y - c.y) - (d.x - c.x) * (b.y - a.y);
  if (det === 0) return false;
  const lambda = ((d.y - c.y) * (d.x - a.x) + (c.x - d.x) * (d.y - a.y)) / det;
  const gamma = ((a.y - b.y) * (d.x - a.x) + (b.x - a.x) * (d.y - a.y)) / det;
  return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
};
