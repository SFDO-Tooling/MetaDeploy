// @flow

const routes = {
  home: () => '/',
  product_list: () => '/products',
  product_detail: (productSlug?: string = ':productSlug') =>
    `/products/${productSlug}`,
  version_detail: (
    productSlug?: string = ':productSlug',
    versionSlug?: string = ':versionSlug',
  ) => `/products/${productSlug}/${versionSlug}`,
  plan_detail: (
    productSlug?: string = ':productSlug',
    versionSlug?: string = ':versionSlug',
    planSlug?: string = ':planSlug',
  ) => `/products/${productSlug}/${versionSlug}/${planSlug}`,
};

export default routes;
