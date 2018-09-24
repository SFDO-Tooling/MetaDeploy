// @flow

export type Step = {
  +id: number,
  +name: string,
  +kind: string,
  +kind_icon: string | null,
  +is_required: boolean,
  +is_recommended: boolean,
};
export type Plan = {
  +id: number,
  +slug: string,
  +title: string,
  +preflight_message: string,
  +steps: Array<Step>,
};
export type Plans = Array<Plan>;
