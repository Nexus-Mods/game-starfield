/* eslint-disable */
import * as React from 'react';
import { ControlLabel, DropdownButton, FormGroup, Panel, MenuItem, HelpBlock } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { MainContext, More, Toggle, selectors, types, util } from 'vortex-api';

import { setIgnoreSaveGameVersion, setLoadOrderManagementType, setPluginsEnabler } from '../actions/settings';

import { NS } from '../common';

import { forceRefresh, setPluginManagementEnabled, switchToLoot } from '../util';
import { LoadOrderManagementType } from '../types';

interface IBaseProps {
  onSetDirectoryJunction: (enabled: boolean) => void;
  needsEnabler: () => boolean;
  allowLootSorting: () => boolean;
  sort: () => Promise<void>;
}

interface IConnectedProps {
  enableDirectoryJunction: boolean;
  pluginEnabler: boolean;
  activeProfile: types.IProfile;
  loManagementType: LoadOrderManagementType;
  ignoreSaveVersion: boolean;
}

type IProps = IBaseProps;

const dropDownItems: { [value: string]: string } = {
  dnd: 'Drag and Drop (Default)',
  gamebryo: 'Rules-based (Classic)',
};

function renderLOManagementType(props: IBaseProps & IConnectedProps): JSX.Element {
  const { t } = useTranslation(NS);
  const { activeProfile } = props;
  const context = React.useContext(MainContext);
  const [selected, setSelected] = React.useState(dropDownItems[props.loManagementType]);
  const dispatch = useDispatch();
  const store = useStore();
  const onSetManageType = React.useCallback((evt) => {
    if (props.allowLootSorting()) {
      context.api.showDialog('info', t('Changing Load Order management method'), {
        text: t('Are you sure you want to change how the load order is managed? Due to the differences in how each method works, there is the potential that some changes you\'ve made will be lost and will need re-doing.'),
      }, [
        { label: 'Cancel' },
        { label: 'Change' },
      ])
        .then(async (res) => {
          if (res.action === 'Change') {
            const api = context.api;
            const prev = props.loManagementType;
            dispatch(setLoadOrderManagementType(activeProfile.id, evt));
            setSelected(dropDownItems[evt]);
            setPluginManagementEnabled(context.api, evt === 'gamebryo');
            if (evt === 'gamebryo') {
              try {
                await switchToLoot(api);
              } catch (err) {
                dispatch(setLoadOrderManagementType(activeProfile.id, prev));
                setSelected(dropDownItems[prev]);
                setPluginManagementEnabled(context.api, false);
                return;
              }
            }
            api.events.emit('show-main-page', 'Dashboard', false);
          }
        })
    }
  }, [context, store, setSelected, activeProfile, dispatch]);
  return (
    <div>
      <DropdownButton
        id='sf-btn-set-management-type'
        title={t(selected)}
        dropup
        onSelect={onSetManageType}
        disabled={!props.allowLootSorting()}
      >
        {
          Object.entries(dropDownItems).map(([value, text]) => (
            <MenuItem key={value} eventKey={value} selected={value === selected}>{t(text)}</MenuItem>
          ))
        }
      </DropdownButton>
    </div>
  );
}

function renderPluginEnablerToggle(props: IBaseProps & IConnectedProps): JSX.Element {
  const { t } = useTranslation(NS);
  const context = React.useContext(MainContext);
  const store = useStore();
  const onSetManageLO = React.useCallback(() => {
    store.dispatch(setPluginsEnabler(false));
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

function renderIgnoreSaveVersion(props: IBaseProps & IConnectedProps): JSX.Element {
  // This functional component was used to render the Ignore Save Game Version option.
  //  As the sfSaveTool is now able to parse older save games created by older versions
  //  of the game (pre-creation) it's theoretically no longer needed.
  //  However, it's kept here in case it is needed in the future.
  const { t } = useTranslation(NS);
  const context = React.useContext(MainContext);
  const store = useStore();
  const onSetIgnoreVersion = React.useCallback((evt) => {
    store.dispatch(setIgnoreSaveGameVersion(evt));
  }, [context, store]);

  const { ignoreSaveVersion } = props;
  const helpBlockText = t('The save game parser is designed to work with save game version 122 and above. '
    + 'That being said, some older versions can still be parsed partially. Please '
    + 'be aware that enabling this option could cause unexpected behaviour during savegame parsing.');

  return (
    <>
      <HelpBlock>{helpBlockText}</HelpBlock>
      <Toggle
        checked={ignoreSaveVersion}
        onToggle={onSetIgnoreVersion}
      >
        {t('Ignore Save Game Version')}
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
    <form id='starfield-settings-form'>
      <FormGroup controlId='default-enable'>

        <ControlLabel className='starfield-settings-heading'>{t('Starfield Settings')}</ControlLabel>

        {props.needsEnabler() && renderPluginEnablerToggle(combined)}

        <Panel key='folder-junction'>
          <Panel.Body>
            <ControlLabel className='starfield-settings-subheading'>
              {t('Folder Junction')}
              <More id='more-deploy' name={t('Folder Junction')} >
                {t('Starfield breaks the Bethesda-game trend by having a secondary data folder at "Documents\\My Games\\Starfield\\Data" which, in most case, overrides the regular Data folder in the game installation. To get around this, Vortex can create a specific type of shortcut (called a folder junction) between the regular Data folder and the one in the My Games folder. This tricks the game engine into using the same Data folder and simplifies mod installation.')}
              </More>
            </ControlLabel>
            <Toggle
              checked={connectedProps.enableDirectoryJunction}
              onToggle={onToggle}
            >{t('Use Folder Junction')}
            </Toggle>
            <HelpBlock>
              {t('This will allow you to enable/disable the use of folder junctions for the game.')}
            </HelpBlock>
          </Panel.Body>
        </Panel>

        <Panel key='load-order-management-method'>
          <Panel.Body>
            <ControlLabel className='starfield-settings-subheading'>
              {t('Load Order Management Method')}
              <More id='more-deploy' name={t('Mangement Methods')} >
                {t('Default uses the "Load Order" page which allows plugins to be sorted via drag and drop and also via LOOT. Classic uses the "Plugins" page that will be familiar for modders of other Bethesda games and is an automated rules-based approach via LOOT.')}
              </More>
            </ControlLabel>
            {!props.needsEnabler() && renderLOManagementType(combined)}
            <HelpBlock>
              {t('Switch between the load order management methods, Drag and Drop (Default) or Rules-based (Classic).')}
            </HelpBlock>
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
    ignoreSaveVersion: util.getSafe(state, ['settings', 'starfield', 'ignoreSaveVersion'], false),
  };
}