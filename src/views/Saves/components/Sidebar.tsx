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
    return <></>;
  }

  // something is selected
  return (
    <>
      {<h3>{generateSaveName(save)}</h3>}
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
