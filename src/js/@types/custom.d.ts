/* eslint-disable one-var */

declare module '*.svg' {
  const svgVal: string;
  export default svgVal;
}

declare module '*.svg?raw' {
  const svgVal: string;
  export default svgVal;
}

declare module '*.png' {
  const pngVal: string;
  export default pngVal;
}

// TypeScript renamed or removed globals,
// but some packages (e.g. react-fns) still reference the old names.
type PositionError = GeolocationPositionError;
type DeviceAcceleration = DeviceMotionEventAccelerationInit;
type DeviceRotationRate = DeviceMotionEventRotationRateInit;
