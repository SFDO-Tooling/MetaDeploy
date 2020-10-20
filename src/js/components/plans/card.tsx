import Button from '@salesforce/design-system-react/components/button';
import Card from '@salesforce/design-system-react/components/card';
import i18n from 'i18next';
import * as React from 'react';
import { Link } from 'react-router-dom';

const PlanCard = ({ title, url }: { title: string; url: string }) => (
  // title, description (we don't have descirptions for plans?), and linkTo for Btn
  <Card>
    <div>{title}</div>
    <Link to={url} />
  </Card>
);
