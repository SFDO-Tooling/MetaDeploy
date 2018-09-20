// @flow

export type Step = {
  +id: number,
  +name: string,
  +required: boolean,
};
export type Plan = {
  +id: number,
  +slug: string,
  +title: string,
  +preflight_message: string,
  +steps: Array<Step>,
};
export type Plans = Array<Plan>;
