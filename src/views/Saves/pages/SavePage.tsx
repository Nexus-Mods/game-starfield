import React, { useCallback, useEffect, useState } from 'react';
import { IconBar, ITableRowAction, MainPage, ToolbarIcon, types, util } from 'vortex-api';
import { Content, StatusView } from '../components';
import { ISaveGame } from '../types';
import { formatlastPlayed as formatLastPlayed, formatPlaytime, generateSaveName, getSaves } from '../utils';
import { useTranslation } from 'react-i18next';
import path from 'path';
import { mygamesPath } from '../../../util';

export type SavePageProps = {
  api: types.IExtensionApi;
};

export default function SavePage(props: SavePageProps): JSX.Element {
  const { api } = props;

  const [t] = useTranslation('game-starfield');
  const [currentSaveNumber, setCurrentSaveNumber] = useState(0);
  const [loading, setLoading] = useState(true);
  const mainButtonList = [
    {
      component: ToolbarIcon,
      props: () => ({
        id: `btn-refresh-list`,
        key: `btn-refresh-list`,
        icon: `refresh`,
        text: t(`Refresh`),
        className: `load-order-refresh-list`,
        onClick: (): void => {
          reloadSaves();
        },
      }),
    },
    {
      component: ToolbarIcon,
      props: () => ({
        id: `btn-open-saves`,
        key: `btn-open-saves`,
        icon: `open-ext`,
        text: t(`Open Saves Folder`),
        className: `starfield-open-saves`,
        onClick: (): void => {
          util.opn(path.join(mygamesPath(), 'Saves')).catch(() => null);
        },
      }),
    },
  ];
  const saveActions: ITableRowAction[] = [];

  const [selectedRowSave, setSelectedRowSave] = useState<ISaveGame | null>(null);
  const [selectedSave, setSelectedSave] = useState<ISaveGame | null>(null);

  const [sortedSaveGameList, setSortedSaveGames] = useState<[string, ISaveGame][]>([]);

  const saveRowSelected = (save: ISaveGame): void => {
    setSelectedRowSave(save);
  };

  const saveSelected = useCallback(
    (save: ISaveGame) => {
      if (save.Header.SaveNumber !== currentSaveNumber) {
        setCurrentSaveNumber(save.Header.SaveNumber);
      } else {
        setCurrentSaveNumber(currentSaveNumber);
      }

      setSelectedSave(save);
    },
    [currentSaveNumber]
  );

  const reloadSaves = useCallback(async () => {
    setLoading(true);
    setSortedSaveGames([]);
    setSelectedSave(null);
    setSelectedRowSave(null);
    setCurrentSaveNumber(0);
    const saveList = await getSaves(api);
    setSortedSaveGames(Object.entries(saveList).sort(([, saveA], [, saveB]) => saveA.Header.SaveNumber - saveB.Header.SaveNumber));
    const foundSave = Object.values(saveList).find((value) => value.Header.SaveNumber === currentSaveNumber);
    if (foundSave) {
      setSelectedSave(foundSave);
      setSelectedRowSave(foundSave);
    }
    setLoading(false);
  }, [currentSaveNumber]);

  useEffect(() => {
    reloadSaves();
  }, []);

  return (
    <div className='main-page-inner'>
      <MainPage.Header>
        <IconBar
          group='starfield-saves-icons'
          staticElements={mainButtonList}
          className='menubar'
          t={api.translate}
        />
      </MainPage.Header>
      <MainPage.Body>
        {Content({
          isLoading: loading,
          selectedSave: selectedSave,
          saveActions: saveActions,
          sortedSaveGameList: sortedSaveGameList,
          tableAttributes: getTableAttributes(api, selectedSave, saveSelected),
          selectedRowSave: selectedRowSave,
          saveRowSelected: saveRowSelected,
        })}
      </MainPage.Body>
    </div>
  );
};

const getTableAttributes = (
  api: types.IExtensionApi,
  selectedSave: ISaveGame | null,
  saveSelected: (save: ISaveGame) => void
): types.ITableAttribute<[string, ISaveGame]>[] => {
  const [t] = useTranslation('game-starfield');

  const tableAttributes: types.ITableAttribute<[string, ISaveGame]>[] = [

    {
      id: 'lastPlayed',
      name: t('Last Played'),
      calc: ([, save]) => formatLastPlayed(save.Header.DateTime) ?? '',
      placement: 'both',
      edit: {},
    },
    {
      id: 'characterName',
      name: t('Character'),
      calc: ([, save]) => save.Header.PlayerName ?? '',
      placement: 'both',
      edit: {},
    },
    {
      id: 'playerLocation',
      name: t('Location'),
      calc: ([, save]) => save.Header.PlayerLocation ?? '',
      placement: 'both',
      edit: {},
    },
    {
      id: 'characterLevel',
      name: t('Level'),
      calc: ([, save]) => save.Header.PlayerLevel ?? '',
      placement: 'both',
      edit: {},
    },
    {
      id: 'playTime',
      name: t('PlayTime'),
      calc: ([, save]) => formatPlaytime(save.Header.Playtime) ?? '',
      placement: 'both',
      edit: {},
    }, {
      id: 'name',
      name: t('Name'),
      calc: ([, save]) => generateSaveName(save),
      placement: 'both',
      edit: {},
    },
  ];
  return tableAttributes;
};
