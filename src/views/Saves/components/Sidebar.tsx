import React from 'react';
import { IssueSnippet } from './IssueSnippet';
import { ISaveGame } from '../types';
import { useTranslation } from 'react-i18next';
import { generateSaveName } from '../utils';

export type SidebarProps = {
  save: ISaveGame | null;
};

export const Sidebar = (props: SidebarProps): JSX.Element => {
  const { save } = props;

  const [t] = useTranslation('game-starfield');

  // if nothing is selected
  if (!save) {
    return <h4>Choose a save</h4>;
  }

  // something is selected
  return (
    <>
      <h4>{generateSaveName(save)}</h4>

      {IssueSnippet({
        issueHeading: t('Master Plugins:'),
        issue: save.PluginInfo.Plugins,
      })}
      {IssueSnippet({
        issueHeading: t('Medium Masters:'),
        issue: save.PluginInfo.MediumPlugins,
      })}
      {IssueSnippet({
        issueHeading: t('Light Plugins:'),
        issue: save.PluginInfo.LightPlugins,
      })}
    </>
  );
};
