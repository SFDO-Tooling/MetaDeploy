// @flow

import * as React from 'react';
import Button from '@salesforce/design-system-react/components/button';
import Tooltip from '@salesforce/design-system-react/components/tooltip';
import { t } from 'i18next';

type Props = {
  showLogs: boolean,
  toggleLogs: () => void,
  singleLog: boolean,
};

const ToggleLogsDataColumnLabel = ({
  showLogs,
  toggleLogs,
  singleLog,
}: Props) => (
  <>
    <Tooltip
      align="top left"
      content={showLogs || singleLog ? t('Hide Logs') : t('Show Logs')}
      position="overflowBoundaryElement"
    >
      <Button
        assistiveText={{ icon: t('Steps') }}
        variant="icon"
        iconCategory="utility"
        iconName={
          showLogs || singleLog ? 'toggle_panel_bottom' : 'toggle_panel_top'
        }
        onClick={toggleLogs}
      />
    </Tooltip>
    <span title={t('Steps')} className="slds-p-left_x-small">
      {t('Steps')}
    </span>
  </>
);

export default ToggleLogsDataColumnLabel;
