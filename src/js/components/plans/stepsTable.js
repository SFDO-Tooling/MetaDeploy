// @flow

import * as React from 'react';
import Accordion from '@salesforce/design-system-react/components/accordion';
import AccordionPanel from '@salesforce/design-system-react/components/accordion/panel';
import Card from '@salesforce/design-system-react/components/card';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import Icon from '@salesforce/design-system-react/components/icon';
import Tooltip from '@salesforce/design-system-react/components/tooltip';

import type { Plan as PlanType, Step as StepType } from 'plans/reducer';

type DataCellProps = { [string]: mixed, item?: StepType };

class NameDataCell extends React.Component<
  DataCellProps,
  { expanded: boolean },
> {
  constructor(props: DataCellProps) {
    super(props);
    this.state = { expanded: false };
  }

  render(): React.Node {
    const name = this.props.item && this.props.item.name;
    const description = this.props.item && this.props.item.description;
    return (
      <DataTableCell title={name} {...this.props}>
        {description ? (
          <Accordion className="slds-cell-wrap">
            <AccordionPanel
              id={this.props.item && this.props.item.id.toString()}
              summary={name}
              expanded={this.state.expanded}
              onTogglePanel={() => {
                this.setState({ expanded: !this.state.expanded });
              }}
            >
              {description}
            </AccordionPanel>
          </Accordion>
        ) : (
          name
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
  let classes = 'slds-align-middle slds-badge';
  if (!required) {
    classes = `${classes} slds-badge_inverse`;
  }
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
  return (
    <DataTableCell {...props}>
      <Checkbox
        checked={required || recommended}
        disabled={required}
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
        <span style={{ textTransform: 'none', letterSpacing: 0 }}>
          Select steps to install.
        </span>
      }
      triggerClassName="slds-p-left_x-small"
    >
      {/* @@@ This should not be necessary... file a bug. */}
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

const StepsTable = ({ plan }: { plan: PlanType }) => (
  <Card
    heading={<span className="slds-p-left_x-small">{plan.title}</span>}
    className="slds-scrollable_x"
    bodyClassName="slds-m-bottom_none"
  >
    {/* DataTable uses step IDs internally to construct unique keys,
        and they must be strings (not integers) */}
    <DataTable
      items={plan.steps.map(step =>
        Object.assign({}, step, { id: step.id.toString() }),
      )}
      id="plan-steps-table"
    >
      <DataTableColumn
        key="name"
        label="Steps"
        property="name"
        primaryColumn
        truncate
      >
        <NameDataCell />
      </DataTableColumn>
      <DataTableColumn key="kind" label="Type" property="kind" truncate>
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
        <InstallDataCell />
      </DataTableColumn>
    </DataTable>
  </Card>
);

export default StepsTable;
