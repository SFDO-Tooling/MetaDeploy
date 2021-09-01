const routes = {
  home: () => '/',
  product_list: () => '/products',
  product_detail: (productSlug: string) => `/products/${productSlug}`,
  version_detail: (productSlug: string, versionLabel: string) =>
    `/products/${productSlug}/${versionLabel}`,
  plan_detail: (productSlug: string, versionLabel: string, planSlug: string) =>
    `/products/${productSlug}/${versionLabel}/${planSlug}`,
  job_detail: (
    productSlug: string,
    versionLabel: string,
    planSlug: string,
    jobId: string,
  ) => `/products/${productSlug}/${versionLabel}/${planSlug}/jobs/${jobId}`,
};

export const routePatterns = {
  home: () => '/',
  auth_error: () => '/accounts/*',
  product_list: () => '/products',
  product_detail: () => '/products/:productSlug',
  version_detail: () => '/products/:productSlug/:versionLabel',
  plan_detail: () => '/products/:productSlug/:versionLabel/:planSlug',
  job_detail: () =>
    '/products/:productSlug/:versionLabel/:planSlug/jobs/:jobId',
};

export default routes;
