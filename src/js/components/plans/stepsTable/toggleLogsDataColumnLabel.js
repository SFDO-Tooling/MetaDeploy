// @flow

import * as React from 'react';
import Button from '@salesforce/design-system-react/components/button';
import Tooltip from '@salesforce/design-system-react/components/tooltip';
import { t } from 'i18next';

type Props = {
  toggleLogs: () => void,
  hasLogs: boolean,
};

const ToggleLogsDataColumnLabel = ({ toggleLogs, hasLogs }: Props) => (
  <>
    <Tooltip
      align="top left"
      content={hasLogs ? t('Hide Logs') : t('Show Logs')}
      position="overflowBoundaryElement"
    >
      <Button
        assistiveText={{ icon: t('Steps') }}
        variant="icon"
        iconCategory="utility"
        iconName={hasLogs ? 'toggle_panel_bottom' : 'toggle_panel_top'}
        onClick={toggleLogs}
      />
    </Tooltip>
    <span title={t('Steps')} className="slds-p-left_x-small">
      {t('Steps')}
    </span>
  </>
);

export default ToggleLogsDataColumnLabel;
