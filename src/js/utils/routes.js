// @flow

const routes = {
  home: () => '/',
  product_list: () => '/products',
  product_detail: (productSlug?: string = ':productSlug') =>
    `/products/${productSlug}`,
  version_detail: (
    productSlug?: string = ':productSlug',
    versionLabel?: string = ':versionLabel',
  ) => `/products/${productSlug}/${versionLabel}`,
  plan_detail: (
    productSlug?: string = ':productSlug',
    versionLabel?: string = ':versionLabel',
    planSlug?: string = ':planSlug',
  ) => `/products/${productSlug}/${versionLabel}/${planSlug}`,
};

export default routes;
