// @flow

import * as React from 'react';
import Avatar from '@salesforce/design-system-react/components/avatar';
import Card from '@salesforce/design-system-react/components/card';
import { Link } from 'react-router-dom';

type ProductType = {
  +id: number,
  +name: string,
  +version: number,
  +body: string,
};

const Product = ({ item }: { item: ProductType }) => (
  <Link
    to={`/products/${item.id}`}
    className="slds-text-link_reset slds-p-around_medium"
  >
    <Card
      heading={item.name}
      icon={<Avatar variant="entity" label={item.name} />}
    >
      <div className="slds-card__body_inner">
        <div className="slds-text-title">Version {item.version}</div>
        <p>{item.body}</p>
      </div>
    </Card>
  </Link>
);

const Products = () => {
  const fakeData = [
    {
      id: 1,
      name: 'Product 1',
      version: 3.13,
      body: 'This is a description of the product.',
    },
    {
      id: 2,
      name: 'Product 2',
      version: 3.13,
      body: 'This is a description of the product.',
    },
    {
      id: 3,
      name: 'Product 3',
      version: 3.13,
      body: 'This is a description of the product.',
    },
  ];
  const products = fakeData.map(item => <Product item={item} key={item.id} />);
  return <div>{products}</div>;
};

export default Products;
