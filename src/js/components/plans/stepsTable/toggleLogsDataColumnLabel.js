// @flow

import React, { useState } from 'react';
import Button from '@salesforce/design-system-react/components/button';
import Tooltip from '@salesforce/design-system-react/components/tooltip';

type Props = {
  hasJob: boolean,
};

const ToggleLogsDataColumnLabel = ({ hasJob }: Props) => {
  const [hideLogs, toggleLogs] = useState(true);
  return (
    <div className="plan-steps-heading-steps">
      {hasJob && (
        <Tooltip
          align="top left"
          content={hideLogs ? 'Hide Logs' : 'Show Logs'}
          position="overflowBoundaryElement"
        >
          <Button
            assistiveText={{ icon: 'steps' }}
            iconCategory="utility"
            iconName={hideLogs ? 'toggle_panel_top' : 'toggle_panel_bottom'}
            label="Steps"
            onClick={() => toggleLogs(!hideLogs)}
            variant="icon"
            iconSize="medium"
          />
        </Tooltip>
      )}
      <span className="slds-p-left_x-small">Steps</span>
    </div>
  );
};

export default ToggleLogsDataColumnLabel;
