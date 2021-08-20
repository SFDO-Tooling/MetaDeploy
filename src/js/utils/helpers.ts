import { Product, Version } from '@/js/store/products/reducer';
import { LATEST_VERSION } from '@/js/utils/constants';

export const prettyUrlHash = (str: string) =>
  str.replace(/\s+/g, '-').toLowerCase();

export const getVersionLabel = (product: Product, version: Version) =>
  product.most_recent_version?.id === version.id
    ? LATEST_VERSION
    : version.label;
