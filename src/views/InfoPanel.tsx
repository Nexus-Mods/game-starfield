/* eslint-disable */
import * as React from 'react';
import { useSelector } from 'react-redux';
import { Alert } from 'react-bootstrap';
import { MainContext, selectors, tooltip, types, util } from 'vortex-api';

import { GAME_ID, NS } from '../common';
import { forceRefresh } from '../util';

interface IBaseProps {
  onInstallPluginsEnabler: () => void;
}

interface IConnectedProps {
  pluginEnabler: boolean;
  loadOrder: types.ILoadOrderEntry[];
  discovery: types.IDiscoveryResult;
}

export function InfoPanel(props: IBaseProps) {
  const { onInstallPluginsEnabler } = props;
  const { api } = React.useContext(MainContext);
  const [isXbox, setIsXbox] = React.useState(false);
  const t = (input: string) => api.translate(input, { ns: NS });
  const { pluginEnabler, loadOrder, discovery } = useSelector(mapStateToProps);
  const onInstallEnabler = React.useCallback(
    (ev) => {
      onInstallPluginsEnabler();
    },
    [onInstallPluginsEnabler]
  );
  React.useEffect(() => {
    if (!pluginEnabler && loadOrder.length > 0) {
      forceRefresh(api);
    }
    if (!isXbox && discovery?.store === 'xbox') {
      setIsXbox(true);
    }
  }, [isXbox, pluginEnabler, discovery]);
  const renderXboxWarningEnabledSystem = () => {
    return isXbox ? (
      <Alert bsStyle='warning'>
        <p>{t('If you encounter the "This library isn\'t supported" error when launching the game - purge your mods and verify file integrity through the Xbox Game Pass App before deploying your mods again')}</p>
      </Alert>
    ) : null;
  };
  const renderXboxWarningDisabledSystem = () => {
    return isXbox ? (
      <Alert bsStyle='warning'>
        <p>{t('Xbox Game Pass PC users should ensure to remove any existing ASI Loader installations before enabling this system!')}</p>
      </Alert>
    ) : null;
  };
  return pluginEnabler ? (
    <>
      <Alert bsStyle='warning'>
        <p>
          {t('The current implementation of the plugin management system in Starfield is temporary while we wait for the official creation kit from Bethesda.')}
          {t("This means that we expect certain functionality to change in the future, yet we're confident enough to provide interim support.")}
        </p>
        <p>{t('Vortex is configured to help manage your load order using the Plugins.txt. Click the "View Plugins File" button in the toolbar to view its location.')}</p>
        <p>{t('Controlling your Load Order using external tools may cause interferences between Vortex and any such tools. Please ensure to use them separately.')}</p>
      </Alert>
      <p>
        {t(
          'Drag and Drop the plugins to reorder how the game loads them. Please note, this screen will show all plugins available in the plugins directory, regardless of whether they were installed by Vortex or not.'
        )}
      </p>
      <p>{t('Mod descriptions from mod authors may have information to determine the best order.')}</p>
      {renderXboxWarningEnabledSystem()}
      <h4>{t('Additional Information:')}</h4>
      <ul>
        <li>{t('If installing a collection - wait for it to complete before re-visiting this page.')}</li>
        <li>{t('Press the "Reset Plugins File" button if your plugins.txt file is in a corrupted state.')}</li>
        <li>{t('Press the "Refresh List" button to refresh/sync changes.')}</li>
      </ul>
    </>
  ) : (
    <>
      <h4>{t('Plugin Management is not enabled!')}</h4>
      <div>{t('Vortex is configured to help manage your load order using the Plugins.txt. Click the "View Plugins File" button in the toolbar to view its location.')}</div>
      <div>{t('Plugin enabling mods/tools are required in order for the game to load your plugins. You can install them by pressing the button below.')}</div>
      <div>{t('Please note that if you\'re currently using the "sTestFileX=" pattern when managing plugins, these will be removed from the INI file and migrated to "plugins.txt" file as they will interfere with the load ordering system.')}</div>
      {renderXboxWarningDisabledSystem()}
      <tooltip.Button tooltip={'Enable Plugin Management'} onClick={onInstallEnabler}>
        {t('Enable Plugin Management')}
      </tooltip.Button>
    </>
  );
}

function mapStateToProps(state: any): IConnectedProps {
  const profile = selectors.activeProfile(state);
  return {
    pluginEnabler: util.getSafe(state, ['settings', 'starfield', 'pluginEnabler'], false),
    loadOrder: util.getSafe(state, ['persistent', 'loadOrder', profile?.id], []),
    discovery: selectors.discoveryByGame(state, GAME_ID),
  };
}
