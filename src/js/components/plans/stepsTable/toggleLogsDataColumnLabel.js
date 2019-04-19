// @flow

import React, { useState } from 'react';
import Button from '@salesforce/design-system-react/components/button';
import Tooltip from '@salesforce/design-system-react/components/tooltip';
import { t } from 'i18next';

const ToggleLogsDataColumnLabel = () => {
  const [hideLogs, toggleLogs] = useState(true);
  return (
    <>
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
      <span title={t('Steps')} className="slds-p-left_x-small">
        {t('Steps')}
      </span>
    </>
  );
};

export default ToggleLogsDataColumnLabel;
