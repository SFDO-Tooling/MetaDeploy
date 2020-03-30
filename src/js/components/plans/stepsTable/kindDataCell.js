// @flow

import * as React from 'react';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import Icon from '@salesforce/design-system-react/components/icon';
import classNames from 'classnames';
import i18n from 'i18next';

import type { DataCellProps } from 'components/plans/stepsTable';

const KindDataCell = (props: DataCellProps): React.Node => {
  /* istanbul ignore if */
  if (!props.item) {
    return null;
  }
  const isActive = props.activeJobStep && props.item.id === props.activeJobStep;
  const iconName = props.item.kind_icon;
  const value = props.item.kind;
  const { className, ...otherProps } = props;
  return (
    <DataTableCell
      title={i18n.t(value)}
      className={classNames(className, 'plan-step-item', 'plan-step-type', {
        'is-installing': isActive,
      })}
      {...otherProps}
    >
      {iconName ? (
        <Icon
          className="slds-m-right_x-small"
          category="utility"
          name={iconName}
          assistiveText={{
            label: i18n.t(value),
          }}
          size="x-small"
        />
      ) : null}
      <span>{i18n.t(value)}</span>
    </DataTableCell>
  );
};
KindDataCell.displayName = DataTableCell.displayName;

export default KindDataCell;
