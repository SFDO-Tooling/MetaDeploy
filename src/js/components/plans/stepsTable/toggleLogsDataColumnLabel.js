// @flow

import * as React from 'react';
import Button from '@salesforce/design-system-react/components/button';
import Tooltip from '@salesforce/design-system-react/components/tooltip';
import i18n from 'i18next';

type Props = {
  logsExpanded: boolean,
  hasLogs: boolean,
  toggleLogs: (hide: boolean) => void,
};

class ToggleLogsDataColumnLabel extends React.Component<Props> {
  toggleClicked = () => {
    const { logsExpanded, toggleLogs } = this.props;
    toggleLogs(logsExpanded);
  };

  render() {
    const { logsExpanded, hasLogs } = this.props;
    return (
      <>
        <Tooltip
          align="top left"
          content={logsExpanded ? i18n.t('Hide Logs') : i18n.t('Show Logs')}
          position="overflowBoundaryElement"
        >
          <Button
            assistiveText={{ icon: i18n.t('Steps') }}
            variant="icon"
            iconCategory="utility"
            iconName={logsExpanded ? 'toggle_panel_bottom' : 'toggle_panel_top'}
            disabled={!hasLogs}
            onClick={this.toggleClicked}
          />
        </Tooltip>
        <span title={i18n.t('Steps')} className="slds-p-left_x-small">
          {i18n.t('Steps')}
        </span>
      </>
    );
  }
}

export default ToggleLogsDataColumnLabel;
