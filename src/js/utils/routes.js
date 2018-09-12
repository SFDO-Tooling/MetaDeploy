// @flow

const routes = {
  home: () => '/',
  product_list: () => '/products',
  product_detail: (id: number | void) =>
    `/products/${id === undefined ? ':id' : id}`,
};

export default routes;
