import React, { useCallback, useEffect, useState } from 'react';
import { IconBar, ITableRowAction, MainPage, ToolbarIcon, types } from 'vortex-api';
import { Content, StatusView } from '../components';
import { ISaveGame } from '../types';
import { generateSaveName, getSaves } from '../utils';
import { useTranslation } from 'react-i18next';

export type SavePageProps = {
  api: types.IExtensionApi;
};

export default function SavePage(props: SavePageProps): JSX.Element {
  const { api } = props;

  const [t] = useTranslation('game-starfield');
  const [currentSaveNumber, setCurrentSaveNumber] = useState(0);
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
  }, [currentSaveNumber]);

  useEffect(() => {
    reloadSaves();
  }, []);

  return (
    <>
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
          selectedSave: selectedSave,
          saveActions: saveActions,
          sortedSaveGameList: sortedSaveGameList,
          tableAttributes: getTableAttributes(api, selectedSave, saveSelected),
          selectedRowSave: selectedRowSave,
          saveRowSelected: saveRowSelected,
        })}
      </MainPage.Body>
    </>
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
      id: 'name',
      name: t('Name'),
      calc: ([, save]) => generateSaveName(save),
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
      id: 'characterLevel',
      name: t('Level'),
      calc: ([, save]) => save.Header.PlayerLevel ?? '',
      placement: 'both',
      edit: {},
    },
    {
      id: 'playTime',
      name: t('PlayTime'),
      calc: ([, save]) => save.Header.Playtime ?? '',
      placement: 'both',
      edit: {},
    },
    {
      id: 'status',
      name: t('Status'),
      customRenderer: (data): JSX.Element => {
        if (data.length && typeof data[0] === 'string' && !Array.isArray(data[1])) {
          const save = data[1];
          return <StatusView api={api} save={save} />;
        }
        return <></>;
      },
      placement: 'both',
      edit: {},
    },
  ];
  return tableAttributes;
};
