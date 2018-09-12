// @flow

const routes = {
  home: () => '/',
  product_list: () => '/products',
  product_detail: (productSlug: string | void) =>
    `/products/${productSlug === undefined ? ':productSlug' : productSlug}`,
  version_detail: (productSlug: string | void, versionSlug: string | void) => {
    const product = productSlug === undefined ? ':productSlug' : productSlug;
    const version = versionSlug === undefined ? ':versionSlug' : versionSlug;
    return `/products/${product}/${version}`;
  },
  plan_detail: (
    productSlug: string | void,
    versionSlug: string | void,
    planSlug: string | void,
  ) => {
    const product = productSlug === undefined ? ':productSlug' : productSlug;
    const version = versionSlug === undefined ? ':versionSlug' : versionSlug;
    const plan = planSlug === undefined ? ':planSlug' : planSlug;
    return `/products/${product}/${version}/${plan}`;
  },
};

export default routes;
