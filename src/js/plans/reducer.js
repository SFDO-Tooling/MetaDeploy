// @flow

import type { PlansAction } from 'plans/actions';

export type Step = {
  +id: number,
  +name: string,
  +kind: string,
  +kind_icon: string | null,
  +is_required: boolean,
  +is_recommended: boolean,
  +description: string,
};
export type Plan = {
  +id: number,
  +slug: string,
  +title: string,
  +preflight_message: string,
  +steps: Array<Step>,
};
export type Plans = Array<Plan>;
export type Preflight = { +status: 'requested' | 'started' | 'rejected' };
export type Preflights = {
  [number]: Preflight,
};
export type PlansState = { preflights?: Preflights };

const reducer = (plans: PlansState = {}, action: PlansAction): PlansState => {
  const planId = action.payload;
  switch (action.type) {
    case 'PREFLIGHT_REQUESTED':
      return { ...plans, preflights: { [planId]: { status: 'requested' } } };
    case 'PREFLIGHT_STARTED': {
      return { ...plans, preflights: { [planId]: { status: 'started' } } };
    }
    case 'PREFLIGHT_REJECTED': {
      return { ...plans, preflights: { [planId]: { status: 'rejected' } } };
    }
  }
  return plans;
};

export default reducer;
