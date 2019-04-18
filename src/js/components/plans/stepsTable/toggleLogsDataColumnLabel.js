// @flow

import React, { useState } from 'react';
import Button from '@salesforce/design-system-react/components/button';
import Tooltip from '@salesforce/design-system-react/components/tooltip';
import { t } from 'i18next';

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
          content={hideLogs ? t('Hide Logs') : t('Show Logs')}
          position="overflowBoundaryElement"
        >
          <Button
            assistiveText={{ icon: t('Steps') }}
            variant="icon"
            iconCategory="utility"
            iconName={hideLogs ? 'toggle_panel_top' : 'toggle_panel_bottom'}
            onClick={() => toggleLogs(!hideLogs)}
          />
        </Tooltip>
      )}
      <span className="slds-p-left_x-small">{t('Steps')}</span>
    </div>
  );
};

export default ToggleLogsDataColumnLabel;
