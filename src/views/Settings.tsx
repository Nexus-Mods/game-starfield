/* eslint-disable */
import * as React from 'react';
import { ControlLabel, DropdownButton, FormGroup, Panel, MenuItem, HelpBlock } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { actions, MainContext, Toggle, selectors, types, util } from 'vortex-api';

import { setLoadOrderManagementType, setPluginsEnabler } from '../actions/settings';

import { NS, MISSING_PLUGINS_NOTIFICATION_ID, GAME_ID } from '../common';

import { forceRefresh, setPluginManagementEnabled } from '../util';
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

const dropDownItems: { [value: string]: string } = {
  dnd: 'Drag and Drop',
  gamebryo: 'Automated (LOOT)',
};

function renderLOManagementType(props: IBaseProps & IConnectedProps): JSX.Element {
  const { t } = useTranslation(NS);
  const { activeProfile } = props;
  const context = React.useContext(MainContext);
  const [selected, setSelected] = React.useState(dropDownItems[props.loManagementType]);
  const dispatch = useDispatch();
  const store = useStore();
  const onSetManageType = React.useCallback((evt) => {
    context.api.showDialog('info', t('Setting Load Order Management Type'), {
      text: t('This operation requires Vortex to restart. Are you sure you want to change the load order management type?'),
    }, [
      { label: 'Cancel' },
      { label: 'Restart' },
    ])
    .then((res) => {
      if (res.action === 'Restart') {
        dispatch(setLoadOrderManagementType(activeProfile.id, evt));
        setSelected(dropDownItems[evt]);
        setPluginManagementEnabled(context.api, evt === 'gamebryo');
        context.api.events.emit('relaunch-application', GAME_ID);
      }
    });
  }, [context, store, setSelected, activeProfile, dispatch]);
  return (
    <DropdownButton
      id='sf-btn-set-management-type'
      title={t(selected)}
      onSelect={onSetManageType}
      dropup
    >
    {
      Object.entries(dropDownItems).map(([value, text]) => (
        <MenuItem key={value} eventKey={value} selected={value === selected}>{t(text)}</MenuItem>
      ))
    }
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
      <HelpBlock>{loHelpBlockText}</HelpBlock>
      <Toggle
        disabled={!needsEnabler || !pluginEnabler}
        checked={pluginEnabler}
        onToggle={onSetManageLO}
      >
        {t('Manage Load Order')}
      </Toggle>
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
  const combined = { ...props, ...connectedProps };
  return (
    <form>
      <FormGroup controlId='default-enable'>
        <Panel>
          <Panel.Body>
            <ControlLabel>{t('Starfield')}</ControlLabel>
            {props.needsEnabler() && renderPluginEnablerToggle(combined)}
            <>
              <HelpBlock>
                {t('This will allow you to enable/disable the use of folder junctions for the game.')}
              </HelpBlock>
              <Toggle
                checked={connectedProps.enableDirectoryJunction}
                onToggle={onToggle}
              >
                {t('Use Folder Junction')}
              </Toggle>
            </>
            <>
              <HelpBlock>
                {t('Allows you to switch between automated LOOT sorting or drag and drop')}
              </HelpBlock>
              {!props.needsEnabler() && renderLOManagementType(combined)}
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
    loManagementType: util.getSafe(state, ['settings', 'starfield', 'loadOrderManagementType', profile.id], 'dnd'),
  };
}