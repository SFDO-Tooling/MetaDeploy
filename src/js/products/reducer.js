// @flow

import type { ProductsAction } from 'products/actions';

export type Product = {
  +id: number,
  +title: string,
  +version: string,
  +description: string,
  +category: string,
  +icon: {
    +type: 'url' | 'slds',
    +category?: 'action' | 'custom' | 'doctype' | 'standard' | 'utility',
    +name?: string,
    +url?: string,
  },
};
export type Products = Array<Product>;

const reducer = (state: Products = [], action: ProductsAction): Products => {
  switch (action.type) {
    case 'FETCH_PRODUCTS_SUCCEEDED':
      return action.payload;
  }
  return state;
};

export default reducer;
