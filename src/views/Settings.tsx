import * as React from 'react';
import { ControlLabel, FormGroup, Panel, HelpBlock } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useSelector, useStore } from 'react-redux';
import { MainContext, Toggle, util } from 'vortex-api';

import { setPluginsEnabler } from '../actions/settings';

import { NS, JUNCTION_TEXT, MISSING_PLUGINS_NOTIFICATION_ID } from '../common';

import { forceRefresh } from '../util';

interface IBaseProps {
  onSetDirectoryJunction: (enabled: boolean) => void;
}

interface IConnectedProps {
  enableDirectoryJunction: boolean;
  pluginEnabler: boolean;
}

type IProps = IBaseProps;

export default function Settings(props: IProps) {
  const { t } = useTranslation(NS);
  const { onSetDirectoryJunction } = props;
  const store = useStore();
  const onToggle = React.useCallback((newVal) => {
    onSetDirectoryJunction(newVal);
  }, [onSetDirectoryJunction]);

  const context = React.useContext(MainContext);

  const onSetManageLO = React.useCallback(() => {
    store.dispatch(setPluginsEnabler(false));
    context.api.dismissNotification(MISSING_PLUGINS_NOTIFICATION_ID);
    forceRefresh(context.api);
  }, [context, store]);

  const { enableDirectoryJunction, pluginEnabler } = useSelector(mapStateToProps);
  const loHelpBlockText = pluginEnabler
    ? t('This will tell Vortex to disable plugin load order management.')
    : t('Please enable plugin load order management through the load order screen.');
  return (
    <form>
      <FormGroup controlId='default-enable'>
        <Panel>
          <Panel.Body>
            <ControlLabel>{t('Starfield')}</ControlLabel>
            <Toggle
              disabled={!pluginEnabler}
              checked={pluginEnabler}
              onToggle={onSetManageLO}
            >
              {t('Manage Load Order')}
            </Toggle>
            <HelpBlock>
              {loHelpBlockText}
            </HelpBlock>
            <Toggle
              checked={enableDirectoryJunction}
              onToggle={onToggle}
            >
              {t('Use Folder Junction')}
            </Toggle>
            <HelpBlock>
              {t('This will allow you to enable/disable the use of folder junctions for the game.')}
            </HelpBlock>
          </Panel.Body>
        </Panel>
      </FormGroup>
    </form>
  );
}

function mapStateToProps(state: any): IConnectedProps {
  return {
    enableDirectoryJunction: util.getSafe(state, ['settings', 'starfield', 'enableDirectoryJunction'], false),
    pluginEnabler: util.getSafe(state, ['settings', 'starfield', 'pluginEnabler'], false),
  };
}