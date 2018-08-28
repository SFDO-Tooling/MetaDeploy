// @flow

const routes = {
  home: () => '/',
  product_list: () => '/products',
  product_detail: (id: number) => `/products/${id}`,
};

export default routes;
