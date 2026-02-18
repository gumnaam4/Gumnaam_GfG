
export enum ZoneType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  GREEN = 'GREEN',
  INDUSTRIAL = 'INDUSTRIAL',
  HIGHWAY = 'HIGHWAY'
}

export enum RoadLevel {
  HIGHWAY = 1,
  ARTERIAL = 2,
  LOCAL = 3
}

export interface Point {
  x: number;
  y: number;
}

export interface Road {
  id: string;
  start: Point;
  end: Point;
  level: RoadLevel;
  width: number;
}

export interface Building {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  levels: number; // For 3D representation height
  zone: ZoneType;
  rotation: number;
}

export interface UrbanBlock {
  points: Point[];
  zone: ZoneType;
  buildings: Building[];
}

export interface CityConfig {
  populationDensity: number; // 0-1
  greenRatio: number; // 0-1
  commercialRatio: number; // 0-1
  residentialRatio: number; // 0-1
  roadComplexity: number; // 0-1
  skylineVariation: number; // 0-1
  semanticIntent: string;
  seed: number;
}

export interface SemanticMapping {
  greenRatio: number;
  commercialRatio: number;
  residentialRatio: number;
  roadComplexity: number;
  maxBuildingHeight: number;
  zoneClustering: number;
}
