/* eslint-disable */
import * as React from 'react';
import { useSelector, useStore } from 'react-redux';
import { Alert } from 'react-bootstrap';
import { MainContext, tooltip, types, util } from 'vortex-api';

import { NS } from '../common';
import { openAppDataPath } from '../util';

interface IBaseProps {
  onInstallPluginsEnabler: () => void;
}

interface IConnectedProps {
  pluginEnabler: boolean;
}

export default function InfoPanel(props: IBaseProps) {
  const { onInstallPluginsEnabler } = props;
  const { api } = React.useContext(MainContext);
  const t = (input: string) => api.translate(input, { ns: NS });
  const { pluginEnabler } = useSelector(mapStateToProps);
  const onInstallEnabler = React.useCallback((ev) => {
    onInstallPluginsEnabler();
  }, [onInstallPluginsEnabler]);

  return pluginEnabler ? (
    <div>
      <Alert bsStyle='warning'>
        <div>
          {t('The current implementation of the plugin management system in Starfield is temporary while we wait for the official creation kit from Bethesda.')}
          {t('This means that we expect certain functionality to change in the future, yet we\'re confident enough to provide interim support.')}
        </div>
        <div>
          {t('Vortex is configured to help manage your load order using the Plugins.txt. Click the "View Plugins File" button in the toolbar to view its location.')}
        </div>
        <div>
          {t('Controlling your Load Order using external tools may cause interferences between Vortex and any such tools. Please ensure to use them separately.')}
        </div>
      </Alert>
      <div>
        {t('Drag and Drop the plugins to reorder how the game loads them. Please note, this screen will show all plugins available in the plugins directory, regardless of whether they were installed by Vortex or not.')}
      </div>
      <div>
        {t('Mod descriptions from mod authors may have information to determine the best order.')}
      </div>
    </div>
  ) : (
    <div>
      <h4>
        {t('Plugin Management is not enabled!')}
      </h4>
      <div>
        {t('Vortex is configured to help manage your load order using the Plugins.txt. Click the "View Plugins File" button in the toolbar to view its location.')}
      </div>
      <div>
        {t('Plugin enabling mods/tools are required in order for the game to load your plugins. You can install them by pressing the button below.')}
      </div>
      <tooltip.Button
        tooltip={'Enable Plugin Management'}
        onClick={onInstallEnabler}
      >
        {t('Enable Plugin Management')}
      </tooltip.Button>
    </div>
  );
}

function mapStateToProps(state: any): IConnectedProps {
  return {
    pluginEnabler: util.getSafe(state, ['settings', 'starfield', 'pluginEnabler'], false),
  };
}