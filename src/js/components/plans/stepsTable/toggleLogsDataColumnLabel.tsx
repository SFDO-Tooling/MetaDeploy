import Button from '@salesforce/design-system-react/components/button';
import Tooltip from '@salesforce/design-system-react/components/tooltip';
import { t } from 'i18next';
import * as React from 'react';

type Props = {
  logsExpanded: boolean;
  hasLogs: boolean;
  toggleLogs: (hide: boolean) => void;
};

const ToggleLogsDataColumnLabel = (props: Props) => {
  const { logsExpanded, hasLogs, toggleLogs } = props;

  const handleToggle = React.useCallback(() => {
    toggleLogs(logsExpanded);
  }, [logsExpanded, toggleLogs]);

  return (
    <>
      <Tooltip
        align="top left"
        content={logsExpanded ? t('Hide Logs') : t('Show Logs')}
        position="overflowBoundaryElement"
      >
        <Button
          assistiveText={{ icon: t('Steps') }}
          variant="icon"
          iconCategory="utility"
          iconName={logsExpanded ? 'toggle_panel_bottom' : 'toggle_panel_top'}
          disabled={!hasLogs}
          onClick={handleToggle}
        />
      </Tooltip>
      <span title={t('Steps')} className="slds-p-left_x-small">
        {t('Steps')}
      </span>
    </>
  );
};

export default ToggleLogsDataColumnLabel;
