import * as React from 'react';
import { ControlLabel, DropdownButton, FormGroup, Panel, MenuItem, HelpBlock } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useSelector, useStore } from 'react-redux';
import { MainContext, Toggle, selectors, types, util } from 'vortex-api';

import { setLoadOrderManagementType, setPluginsEnabler } from '../actions/settings';

import { NS, MISSING_PLUGINS_NOTIFICATION_ID } from '../common';

import { forceRefresh } from '../util';
import { LoadOrderManagementType } from '../types';

interface IBaseProps {
  onSetDirectoryJunction: (enabled: boolean) => void;
  needsEnabler: () => boolean;
}

interface IConnectedProps {
  enableDirectoryJunction: boolean;
  pluginEnabler: boolean;
  activeProfile: types.IProfile;
  loManagementType: LoadOrderManagementType;
}

type IProps = IBaseProps;

function renderLOManagementType(props: IBaseProps & IConnectedProps): JSX.Element {
  const { t } = useTranslation(NS);
  const { loManagementType, activeProfile } = props;
  const context = React.useContext(MainContext);
  const store = useStore();
  const onSetManageType = React.useCallback((evt) => {
    context.api.sendNotification({
      type: 'success',
      message: t('Load order management type set to {{type}}', { type: evt }),
      displayMS: 5000,
    });
    store.dispatch(setLoadOrderManagementType(activeProfile.id, evt));
    context.api.dismissNotification(MISSING_PLUGINS_NOTIFICATION_ID);
    forceRefresh(context.api);
  }, [context, store]);
  return (
    <DropdownButton
      id='sf-btn-set-management-type'
      title={t('Set Load Order Management Type')}
      onSelect={onSetManageType}
      value={loManagementType}
      dropup
      style={{ display: 'block', marginLeft: 'auto', marginRight: 0 }}
    >
      <MenuItem eventKey='dnd'>{t('Drag and Drop')}</MenuItem>
      <MenuItem eventKey='gamebryo'>{t('Automated Sorting')}</MenuItem>
    </DropdownButton>
  );
}

function renderPluginEnablerToggle(props: IBaseProps & IConnectedProps): JSX.Element {
  const { t } = useTranslation(NS);
  const context = React.useContext(MainContext);
  const store = useStore();
  const onSetManageLO = React.useCallback(() => {
    store.dispatch(setPluginsEnabler(false));
    context.api.dismissNotification(MISSING_PLUGINS_NOTIFICATION_ID);
    forceRefresh(context.api);
  }, [context, store]);

  const { pluginEnabler, needsEnabler } = props;
  const loHelpBlockText = props.pluginEnabler
    ? t('This will tell Vortex to disable plugin load order management.')
    : t('Please enable plugin load order management through the load order screen.');

  return (
    <>
      <Toggle
        disabled={!needsEnabler || !pluginEnabler}
        checked={pluginEnabler}
        onToggle={onSetManageLO}
      >
        {t('Manage Load Order')}
      </Toggle>
      <HelpBlock>
        {loHelpBlockText}
      </HelpBlock>
    </>
  )
}

export default function Settings(props: IProps) {
  const { t } = useTranslation(NS);
  const { onSetDirectoryJunction } = props;
  const onToggle = React.useCallback((newVal) => {
    onSetDirectoryJunction(newVal);
  }, [onSetDirectoryJunction]);

  const connectedProps = useSelector(mapStateToProps);
  return (
    <form>
      <FormGroup controlId='default-enable'>
        <Panel>
          <Panel.Body>
            <ControlLabel>{t('Starfield')}</ControlLabel>
            {props.needsEnabler() && renderPluginEnablerToggle({ ...props, ...connectedProps })}
            <>
              <Toggle
                checked={connectedProps.enableDirectoryJunction}
                onToggle={onToggle}
              >
                {t('Use Folder Junction')}
              </Toggle>
              <HelpBlock>
                {t('This will allow you to enable/disable the use of folder junctions for the game.')}
              </HelpBlock>
            </>
            <>
              {!props.needsEnabler() && renderLOManagementType({ ...props, ...connectedProps })}
            </>
          </Panel.Body>
        </Panel>
      </FormGroup>
    </form>
  );
}

function mapStateToProps(state: any): IConnectedProps {
  const profile = selectors.activeProfile(state);
  return {
    enableDirectoryJunction: util.getSafe(state, ['settings', 'starfield', 'enableDirectoryJunction'], false),
    pluginEnabler: util.getSafe(state, ['settings', 'starfield', 'pluginEnabler'], false),
    activeProfile: profile,
    loManagementType: util.getSafe(state, ['settings', 'loadOrderManagementType', profile.id], 'dnd'),
  };
}