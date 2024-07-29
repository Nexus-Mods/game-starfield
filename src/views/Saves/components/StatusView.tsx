import React from 'react';
import { tooltip, types } from 'vortex-api';
import { ISaveGame } from '../types';
import { useTranslation } from 'react-i18next';

export type StatusViewProps = {
  api: types.IExtensionApi;
  save: ISaveGame;
};

// Custom Renderer has no Context access
export const StatusView = (props: StatusViewProps): JSX.Element => {
  const appendIssues = (allIssues: string[], issues: string[] | undefined, message: string): void => {
    if (issues && issues.length) {
      allIssues.push(`${issues.length} ${message}`);
    }
  };
  const [t] = useTranslation('game-starfield');
  const { save } = props;

  const allIssues: string[] = [];
  appendIssues(allIssues, save.PluginInfo.Plugins.map(p => p.PluginName), t('Masters'));
  appendIssues(allIssues, save.PluginInfo.MediumPlugins.map(p => p.PluginName), t('Medium Masters'));
  appendIssues(allIssues, save.PluginInfo.LightPlugins.map(p => p.PluginName), t('Light Masters'));

  const icon = 'toggle-enabled';
  const color = 'var(--brand-success)';

  return <tooltip.Icon name={icon} tooltip={allIssues.join('\n')} style={{ color: color }} />;
};
