import mvpCityData from "./content/mvpCityData.json";
import type { TrafficVehicleKind } from "./content/VehicleModel";
import { roundPathCorners } from "./pathGeometry";

export type TrafficPoint = readonly [number, number];

export type TrafficPath = {
  id: string;
  points: readonly TrafficPoint[];
  segmentLengths: readonly number[];
  cumulativeLengths: readonly number[];
  length: number;
};

export type TrafficVehicleSpec = {
  id: string;
  kind: TrafficVehicleKind;
  variant: number;
  path: TrafficPath;
  start: number;
  speed: number;
};

type RawTrafficRoute = {
  id: string;
  points: [number, number][];
};

const LANE_WIDTH = mvpCityData.grid.laneWidth;

function closeCrossCityPath(points: readonly TrafficPoint[]): TrafficPoint[] {
  if (points.length !== 2) return [...points];

  const [start, end] = points;
  const northSouth = Math.abs(end[1] - start[1]) > Math.abs(end[0] - start[0]);
  if (northSouth) {
    const returnX = start[0] - LANE_WIDTH;
    return [
      start,
      end,
      [returnX, end[1]],
      [returnX, start[1]],
      start,
    ];
  }

  const returnZ = start[1] - LANE_WIDTH;
  return [
    start,
    end,
    [end[0], returnZ],
    [start[0], returnZ],
    start,
  ];
}

function createTrafficPath(route: RawTrafficRoute): TrafficPath {
  const points = roundPathCorners(
    closeCrossCityPath(route.points),
    LANE_WIDTH * 1.35,
    9,
  );
  const closed =
    points[0][0] === points[points.length - 1][0] &&
    points[0][1] === points[points.length - 1][1]
      ? points
      : [...points, points[0]];
  const segmentLengths = closed.slice(0, -1).map((point, index) =>
    Math.hypot(
      closed[index + 1][0] - point[0],
      closed[index + 1][1] - point[1],
    ),
  );
  const cumulativeLengths = segmentLengths.reduce<number[]>(
    (lengths, segmentLength) => {
      lengths.push(lengths[lengths.length - 1] + segmentLength);
      return lengths;
    },
    [0],
  );

  return {
    id: route.id,
    points: closed,
    segmentLengths,
    cumulativeLengths,
    length: cumulativeLengths[cumulativeLengths.length - 1],
  };
}

const RAW_ROUTES = [
  ...(mvpCityData.trafficRoutes as unknown as RawTrafficRoute[]),
  ...(mvpCityData.policeRoutes as unknown as RawTrafficRoute[]),
  ...(mvpCityData.taxiRoutes as unknown as RawTrafficRoute[]),
];

const PATHS = new Map(
  RAW_ROUTES.map((route) => [route.id, createTrafficPath(route)]),
);

function getPath(id: string) {
  const path = PATHS.get(id);
  if (!path) throw new Error(`Missing city traffic path: ${id}`);
  return path;
}

const TRAFFIC_DENSITY = [
  { pathId: "traffic_outer_loop", count: 4, kind: "civilian", speed: 6.6 },
  { pathId: "traffic_mid_loop", count: 3, kind: "civilian", speed: 6.1 },
  { pathId: "traffic_inner_loop", count: 2, kind: "civilian", speed: 5.4 },
  { pathId: "traffic_cross_ns", count: 1, kind: "civilian", speed: 6.8 },
  { pathId: "traffic_cross_ew", count: 1, kind: "civilian", speed: 6.7 },
  { pathId: "pirate_taxi_north", count: 1, kind: "taxi", speed: 7.1 },
  { pathId: "pirate_taxi_south", count: 1, kind: "taxi", speed: 6.9 },
  { pathId: "police_main_patrol", count: 1, kind: "police", speed: 6.3 },
  { pathId: "police_center_watch", count: 1, kind: "police", speed: 5.2 },
] as const satisfies readonly {
  pathId: string;
  count: number;
  kind: TrafficVehicleKind;
  speed: number;
}[];

export const CITY_TRAFFIC_VEHICLES = TRAFFIC_DENSITY.flatMap(
  (routeSpec, routeIndex) => {
    const path = getPath(routeSpec.pathId);
    return Array.from({ length: routeSpec.count }, (_, vehicleIndex) => ({
      id: `${routeSpec.pathId}-${vehicleIndex}`,
      kind: routeSpec.kind,
      variant: (routeIndex * 3 + vehicleIndex) % 10,
      path,
      start:
        (vehicleIndex / routeSpec.count + routeIndex * 0.113) % 1,
      speed:
        routeSpec.speed *
        (0.92 + (vehicleIndex % 3) * 0.065),
    }));
  },
) satisfies TrafficVehicleSpec[];

export function sampleTrafficPath(
  path: TrafficPath,
  progress: number,
  target: { x: number; z: number },
) {
  const normalized = ((progress % 1) + 1) % 1;
  const targetLength = normalized * path.length;

  for (let index = 0; index < path.segmentLengths.length; index += 1) {
    const segmentEnd = path.cumulativeLengths[index + 1];
    if (targetLength > segmentEnd) continue;

    const start = path.points[index];
    const end = path.points[index + 1];
    const segmentLength = path.segmentLengths[index];
    const segmentProgress =
      segmentLength === 0
        ? 0
        : (targetLength - path.cumulativeLengths[index]) / segmentLength;
    target.x = start[0] + (end[0] - start[0]) * segmentProgress;
    target.z = start[1] + (end[1] - start[1]) * segmentProgress;
    return target;
  }

  target.x = path.points[0][0];
  target.z = path.points[0][1];
  return target;
}

