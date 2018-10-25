// @flow

import * as React from 'react';
import Accordion from '@salesforce/design-system-react/components/accordion';
import AccordionPanel from '@salesforce/design-system-react/components/accordion/panel';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import Icon from '@salesforce/design-system-react/components/icon';
import Tooltip from '@salesforce/design-system-react/components/tooltip';
import classNames from 'classnames';

import { PlanErrors } from 'components/plans/preflightResults';

import type {
  Plan as PlanType,
  Step as StepType,
  Preflight as PreflightType,
} from 'plans/reducer';
import type { User as UserType } from 'accounts/reducer';

type DataCellProps = {
  [string]: mixed,
  user?: UserType,
  preflight?: ?PreflightType,
  item?: StepType,
  className?: string,
};

class NameDataCell extends React.Component<
  DataCellProps,
  { expanded: boolean },
> {
  constructor(props: DataCellProps) {
    super(props);
    this.state = { expanded: false };
  }

  render(): React.Node {
    const { preflight, item, className, ...otherProps } = this.props;
    if (!item) {
      return null;
    }
    const name = item.name;
    const description = item.description;
    const id = item.id.toString();
    const errors =
      preflight &&
      preflight.has_errors &&
      preflight.results &&
      preflight.results[id];
    const hasError =
      errors &&
      errors.length > 0 &&
      errors.find(err => err.status === 'error') !== undefined;
    const hasWarning =
      errors &&
      errors.length > 0 &&
      errors.find(err => err.status === 'warn') !== undefined;
    const classes = classNames(className, {
      'has-warning': hasWarning,
      'has-error': hasError,
    });
    const errorList =
      errors && (hasError || hasWarning) ? (
        <PlanErrors errorList={errors} />
      ) : null;
    return (
      <DataTableCell title={name} className={classes} {...otherProps}>
        {description ? (
          <>
            <Accordion className="slds-cell-wrap">
              <AccordionPanel
                id={id}
                title={name}
                summary={<p className="slds-cell-wrap">{name}</p>}
                expanded={this.state.expanded}
                onTogglePanel={() => {
                  this.setState({ expanded: !this.state.expanded });
                }}
              >
                {description}
              </AccordionPanel>
            </Accordion>
            {errorList ? (
              <div
                className="step-name-no-icon
                  slds-p-bottom_small
                  slds-cell-wrap"
              >
                {errorList}
              </div>
            ) : null}
          </>
        ) : (
          <div
            className="step-name-no-icon
              slds-p-vertical_small
              slds-cell-wrap"
          >
            <p className={errorList ? 'slds-p-bottom_small' : ''}>{name}</p>
            {errorList}
          </div>
        )}
      </DataTableCell>
    );
  }
}
NameDataCell.displayName = DataTableCell.displayName;

const KindDataCell = (props: DataCellProps): React.Node => {
  const value = props.item && props.item.kind;
  const iconName = props.item && props.item.kind_icon;
  return (
    <DataTableCell title={value} {...props}>
      {iconName ? (
        <Icon
          className="slds-m-right_x-small"
          category="utility"
          name={iconName}
          assistiveText={{
            label: value,
          }}
          size="x-small"
        />
      ) : null}
      <span>{value}</span>
    </DataTableCell>
  );
};
KindDataCell.displayName = DataTableCell.displayName;

const RequiredDataCell = (props: DataCellProps): React.Node => {
  const required = props.item && props.item.is_required;
  const classes = classNames(
    'slds-align-middle',
    'slds-badge',
    'slds-m-horizontal_large',
    { 'slds-badge_inverse': !required },
  );
  const text = required ? 'Required' : 'Optional';
  return (
    <DataTableCell title={text} {...props}>
      <span className={classes}>{text}</span>
    </DataTableCell>
  );
};
RequiredDataCell.displayName = DataTableCell.displayName;

const InstallDataCell = (props: DataCellProps): React.Node => {
  const required = props.item && props.item.is_required;
  const recommended = !required && props.item && props.item.is_recommended;
  const hasValidToken = props.user && props.user.valid_token_for !== null;
  const hasReadyPreflight =
    props.preflight && props.preflight.is_valid && !props.preflight.has_errors;
  const disabled = required || !hasValidToken || !hasReadyPreflight;
  return (
    <DataTableCell {...props}>
      <Checkbox
        checked={required || recommended}
        disabled={disabled}
        className="slds-p-vertical_x-small"
        labels={{ label: recommended ? 'recommended' : '' }}
      />
    </DataTableCell>
  );
};
InstallDataCell.displayName = DataTableCell.displayName;

const InstallDataColumnLabel = (): React.Node => (
  <>
    <span title="Install">Install</span>
    <Tooltip
      align="top right"
      content={
        <span className="step-column-tooltip">Select steps to install.</span>
      }
      triggerClassName="slds-p-left_x-small"
      position="overflowBoundaryElement"
    >
      {/* @@@ This should not be necessary...
          https://github.com/salesforce/design-system-react/issues/1578 */}
      <a>
        <Icon
          category="utility"
          name="info"
          assistiveText={{
            label: 'Learn More',
          }}
          size="xx-small"
        />
      </a>
    </Tooltip>
  </>
);

const StepsTable = ({
  user,
  plan,
  preflight,
}: {
  user: UserType,
  plan: PlanType,
  preflight: ?PreflightType,
}) => (
  // DataTable uses step IDs internally to construct unique keys,
  // and they must be strings (not integers)
  <article className="slds-card slds-scrollable_x">
    <DataTable
      items={plan.steps.map(step => ({ ...step, id: step.id.toString() }))}
      id="plan-steps-table"
    >
      <DataTableColumn key="name" label="Steps" property="name" primaryColumn>
        <NameDataCell preflight={preflight} />
      </DataTableColumn>
      <DataTableColumn key="kind" label="Type" property="kind">
        <KindDataCell />
      </DataTableColumn>
      <DataTableColumn key="is_required" property="is_required">
        <RequiredDataCell />
      </DataTableColumn>
      <DataTableColumn
        key="is_recommended"
        label={<InstallDataColumnLabel />}
        property="is_recommended"
      >
        <InstallDataCell user={user} preflight={preflight} />
      </DataTableColumn>
    </DataTable>
  </article>
);

export default StepsTable;
