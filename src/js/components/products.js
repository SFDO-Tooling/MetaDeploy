// @flow

import * as React from 'react';
import Avatar from '@salesforce/design-system-react/components/avatar';
import Card from '@salesforce/design-system-react/components/card';
import DocumentTitle from 'react-document-title';
import { Link } from 'react-router-dom';

type ProductType = {
  +id: number,
  +title: string,
  +version: string,
  +description: string,
};

const ProductItem = ({ item }: { item: ProductType }) => (
  <Link
    to={`/products/${item.id}`}
    className="slds-text-link_reset slds-p-around_medium"
  >
    <Card
      heading={item.title}
      icon={<Avatar variant="entity" label={item.title} />}
    >
      <div className="slds-card__body_inner">
        <div className="slds-text-title">Version {item.version}</div>
        <p>{item.description}</p>
      </div>
    </Card>
  </Link>
);

const ProductsList = () => {
  const fakeData = [
    {
      id: 1,
      title: 'Product 1',
      version: '3.130',
      description: 'This is a description of the product.',
    },
    {
      id: 2,
      title: 'Product 2',
      version: '4.0.2',
      description: 'This is a description of the product.',
    },
    {
      id: 3,
      title: 'Product 3',
      version: '0.1.0',
      description: 'This is a description of the product.',
    },
  ];
  const products = fakeData.map(item => (
    <ProductItem item={item} key={item.id} />
  ));
  return (
    <DocumentTitle title="Products | MetaDeploy">
      <div>{products}</div>
    </DocumentTitle>
  );
};

export default ProductsList;
