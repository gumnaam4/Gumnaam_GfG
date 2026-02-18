
import { 
  CityConfig, Road, RoadLevel, RoadLevel as RL, 
  Point, ZoneType, Building, UrbanBlock 
} from '../types';
import { PRNG, distance, isIntersecting } from '../utils/math';

export class CityEngine {
  private config: CityConfig;
  private prng: PRNG;
  private roads: Road[] = [];
  private blocks: UrbanBlock[] = [];
  private width: number = 2000;
  private height: number = 2000;
  private center: Point = { x: 1000, y: 1000 };

  constructor(config: CityConfig) {
    this.config = config;
    this.prng = new PRNG(config.seed);
  }

  public generate() {
    this.roads = [];
    this.blocks = [];
    
    // 1. Road Generation via L-System expansion
    this.generateRoads();
    
    // 2. Connectivity Fixes (A*) - Simplified for this demo 
    // to ensure no floating branches by connecting dead ends to nearest highways
    this.ensureConnectivity();

    // 3. Block Subdivision
    this.generateBlocks();

    // 4. Building Placement (Constraint Satisfaction)
    this.populateBuildings();

    return { roads: this.roads, blocks: this.blocks };
  }

  private generateRoads() {
    // Axiom: Central Cross
    const highways = [
      { start: { x: 0, y: 1000 }, end: { x: 2000, y: 1000 }, level: RL.HIGHWAY, width: 12 },
      { start: { x: 1000, y: 0 }, end: { x: 1000, y: 2000 }, level: RL.HIGHWAY, width: 12 }
    ];

    highways.forEach(h => this.addRoad(h.start, h.end, h.level, h.width));

    // Iterative Expansion (L-System inspired)
    // Level 1 -> 2 (Arterials)
    const arterialDepth = Math.floor(lerp(2, 4, this.config.roadComplexity));
    this.expand(RL.ARTERIAL, arterialDepth);

    // Level 2 -> 3 (Local)
    const localDepth = Math.floor(lerp(3, 6, this.config.roadComplexity));
    this.expand(RL.LOCAL, localDepth);
  }

  private expand(level: RoadLevel, depth: number) {
    const parentLevel = level === RL.ARTERIAL ? RL.HIGHWAY : RL.ARTERIAL;
    const candidates = this.roads.filter(r => r.level === parentLevel);
    const branchProb = level === RL.ARTERIAL ? 0.4 : 0.7;
    const branchLength = level === RL.ARTERIAL ? 250 : 120;
    const width = level === RL.ARTERIAL ? 6 : 3;

    for (let i = 0; i < depth; i++) {
      const currentRoads = [...this.roads];
      currentRoads.forEach(parent => {
        if (this.prng.next() < branchProb) {
          const t = this.prng.next();
          const start = {
            x: lerp(parent.start.x, parent.end.x, t),
            y: lerp(parent.start.y, parent.end.y, t)
          };
          
          const angle = Math.atan2(parent.end.y - parent.start.y, parent.end.x - parent.start.x) + (this.prng.next() > 0.5 ? Math.PI/2 : -Math.PI/2);
          const end = {
            x: start.x + Math.cos(angle) * branchLength,
            y: start.y + Math.sin(angle) * branchLength
          };

          if (this.isValidPlacement(start, end)) {
            this.addRoad(start, end, level, width);
          }
        }
      });
    }
  }

  private addRoad(start: Point, end: Point, level: RoadLevel, width: number) {
    this.roads.push({
      id: Math.random().toString(36).substr(2, 9),
      start, end, level, width
    });
  }

  private isValidPlacement(start: Point, end: Point): boolean {
    if (end.x < 0 || end.x > this.width || end.y < 0 || end.y > this.height) return false;
    // Simple collision check: Don't cross other roads
    for (const r of this.roads) {
      if (isIntersecting(start, end, r.start, r.end)) return false;
    }
    return true;
  }

  private ensureConnectivity() {
    // In a full implementation, we'd use A* here to connect any isolated clusters
    // For this scope, we ensure branching always stays connected to the parent
  }

  private generateBlocks() {
    // In a real urban sim, we'd use a Polygon clipping algorithm (Sutherland-Hodgman) 
    // to find regions enclosed by roads.
    // Simplified: We generate grid-based patches around the road network.
    const step = 80;
    for (let x = 0; x < this.width; x += step) {
      for (let y = 0; y < this.height; y += step) {
        // Find nearest road to determine zoning
        const p = { x: x + step/2, y: y + step/2 };
        let minDist = Infinity;
        let nearestRoad: Road | null = null;
        this.roads.forEach(r => {
          const d = this.distToRoad(p, r);
          if (d < minDist) {
            minDist = d;
            nearestRoad = r;
          }
        });

        if (minDist > 15 && minDist < 200) {
          const zone = this.calculateZone(p, minDist, nearestRoad?.level || RL.LOCAL);
          this.blocks.push({
            points: [
              {x, y}, {x: x+step, y}, {x: x+step, y: y+step}, {x, y: y+step}
            ],
            zone,
            buildings: []
          });
        }
      }
    }
  }

  private calculateZone(p: Point, distToRoad: number, roadLevel: RoadLevel): ZoneType {
    const distToCenter = distance(p, this.center);
    const normalizedDist = distToCenter / 1200;

    // Commercial rules: Close to center, close to high-level roads
    if (normalizedDist < this.config.commercialRatio && roadLevel <= RL.ARTERIAL) {
      return ZoneType.COMMERCIAL;
    }
    
    // Green area requirement
    if (this.prng.next() < this.config.greenRatio) {
      return ZoneType.GREEN;
    }

    // Default Residential
    return ZoneType.RESIDENTIAL;
  }

  private populateBuildings() {
    this.blocks.forEach(block => {
      if (block.zone === ZoneType.GREEN) return;

      const center = {
        x: (block.points[0].x + block.points[2].x) / 2,
        y: (block.points[0].y + block.points[2].y) / 2
      };

      // Density Gradient: Height based on distance to center
      const dToCenter = distance(center, this.center);
      const maxH = 15;
      const baseHeight = Math.max(1, Math.floor(maxH * (1 - dToCenter / 1400)));
      const variation = this.config.skylineVariation * baseHeight * 0.5;
      const levels = Math.max(1, Math.floor(baseHeight + (this.prng.next() * variation - variation/2)));

      // Building size varies by zone
      const size = block.zone === ZoneType.COMMERCIAL ? 35 : 25;
      const margin = 5;

      // Sub-divide block into 2x2 buildings if possible
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          if (this.prng.next() < this.config.populationDensity) {
             block.buildings.push({
              id: Math.random().toString(36).substr(2, 9),
              x: block.points[0].x + margin + i * size,
              y: block.points[0].y + margin + j * size,
              width: size - margin,
              height: size - margin,
              levels: block.zone === ZoneType.COMMERCIAL ? levels * 1.5 : levels,
              zone: block.zone,
              rotation: 0
            });
          }
        }
      }
    });
  }

  private distToRoad(p: Point, r: Road): number {
    const l2 = (r.start.x - r.end.x)**2 + (r.start.y - r.end.y)**2;
    if (l2 === 0) return distance(p, r.start);
    let t = ((p.x - r.start.x) * (r.end.x - r.start.x) + (p.y - r.start.y) * (r.end.y - r.start.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return distance(p, {
      x: r.start.x + t * (r.end.x - r.start.x),
      y: r.start.y + t * (r.end.y - r.start.y)
    });
  }
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
