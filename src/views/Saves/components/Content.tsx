import React from 'react';
import { Panel } from 'react-bootstrap';
import { FlexLayout, ITableRowAction, Spinner, Table, types, EmptyPlaceholder } from 'vortex-api';
import { Sidebar } from './Sidebar';
import { ISaveGame } from '../types';
import { useTranslation } from 'react-i18next';

export type ContentProps = {
  isLoading: boolean;
  selectedSave: ISaveGame | null;
  saveActions: ITableRowAction[];
  sortedSaveGameList: [string, ISaveGame][];
  tableAttributes: types.ITableAttribute<[string, ISaveGame]>[];
  selectedRowSave: ISaveGame | null;
  saveRowSelected: (save: ISaveGame) => void;
};

export const Content = (props: ContentProps): JSX.Element => {
  const { isLoading, saveActions, sortedSaveGameList, tableAttributes, selectedRowSave, saveRowSelected } = props;

  const [t] = useTranslation('game-starfield');

  return (
    <Panel>
      <Panel.Body>
        {
          isLoading ?
            <div className='starfield-save-reading-spinner'>
              <Spinner /> {t('Reading Saves folder...')}
            </div>
            : sortedSaveGameList.length > 0
              ?
              <FlexLayout type="row" className="starfield-save-container">
                <FlexLayout.Flex className="starfield-save-table">
                  <Table
                    tableId="starfield-savegames"
                    data={sortedSaveGameList}
                    staticElements={tableAttributes}
                    actions={saveActions}
                    multiSelect={false}
                    hasActions={false}
                    showDetails={false}
                    onChangeSelection={(ids: string[]) => saveRowSelected(sortedSaveGameList[parseInt(ids[0]!)]![1])}
                  />
                </FlexLayout.Flex>

                <FlexLayout.Fixed className="starfield-save-sidebar">
                  <Sidebar save={selectedRowSave} />
                </FlexLayout.Fixed>
              </FlexLayout>
              : <EmptyPlaceholder icon={'savegame'} text={'No saves found!'} subtext={'Go fight some space pirates...'} />
        }
      </Panel.Body>
    </Panel>
  );
};
