import React from 'react';
import { Panel } from 'react-bootstrap';
import { FlexLayout, ITableRowAction, Spinner, Table, types } from 'vortex-api';
import { Sidebar } from './Sidebar';
import { ISaveGame } from '../types';
import { useTranslation } from 'react-i18next';
import { generateSaveName } from '../utils';

export type ContentProps = {
  selectedSave: ISaveGame | null;
  saveActions: ITableRowAction[];
  sortedSaveGameList: [string, ISaveGame][];
  tableAttributes: types.ITableAttribute<[string, ISaveGame]>[];
  selectedRowSave: ISaveGame | null;
  saveRowSelected: (save: ISaveGame) => void;
};

export const Content = (props: ContentProps): JSX.Element => {
  const { selectedSave, saveActions, sortedSaveGameList, tableAttributes, selectedRowSave, saveRowSelected } = props;

  const [t] = useTranslation('game-starfield');

  return (
    <Panel>
      <Panel.Body>
        <FlexLayout type="column">
          <FlexLayout.Fixed id="instructions">
            <p>
              {t(
                `Instructions: Select a row to see more information.`
              )}
            </p>
            <p>
              {t(`Currently selected save: `)}
              {`${generateSaveName(selectedSave)}` || t('No Save')}
            </p>
          </FlexLayout.Fixed>
          <FlexLayout type="row">
            <FlexLayout.Flex>
              {sortedSaveGameList.length === 0 &&
                <>
                  <Spinner />
                  <p>{t('Reading savegame folder...')}</p>
                </>}
              {sortedSaveGameList.length > 0 && <Table
                tableId="starfield-savegames"
                data={sortedSaveGameList}
                staticElements={tableAttributes}
                actions={saveActions}
                multiSelect={false}
                hasActions={false}
                showDetails={false}
                onChangeSelection={(ids: string[]) => saveRowSelected(sortedSaveGameList[parseInt(ids[0]!)]![1])}
              />}
            </FlexLayout.Flex>

            <FlexLayout.Fixed id="sidebar">
              <Sidebar save={selectedRowSave} />
            </FlexLayout.Fixed>
          </FlexLayout>
        </FlexLayout>
      </Panel.Body>
    </Panel>
  );
};
