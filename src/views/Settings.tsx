import * as React from 'react';
import { ControlLabel, FormGroup, Panel, HelpBlock } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useSelector, useStore } from 'react-redux';
import { Toggle, util } from 'vortex-api';

import { setManageLoadOrder } from '../actions/settings';

import { NS, JUNCTION_TEXT } from '../common';

interface IBaseProps {
  onSetDirectoryJunction: (enabled: boolean) => void;
}

interface IConnectedProps {
  enableDirectoryJunction: boolean;
  manageLoadOrder: boolean;
}

type IProps = IBaseProps;

export default function Settings(props: IProps) {
  const { t } = useTranslation(NS);
  const { onSetDirectoryJunction } = props;
  const store = useStore();
  const onToggle = React.useCallback((newVal) => {
    onSetDirectoryJunction(newVal);
  }, [onSetDirectoryJunction]);

  const onSetManageLO = React.useCallback((newVal) => {
    store.dispatch(setManageLoadOrder(newVal));
  }, [store]);

  const { enableDirectoryJunction, manageLoadOrder } = useSelector(mapStateToProps);
  return (
    <form>
      <FormGroup controlId='default-enable'>
        <Panel>
          <Panel.Body>
            <ControlLabel>{t('Starfield')}</ControlLabel>
            <Toggle
              checked={manageLoadOrder}
              onToggle={onSetManageLO}
            >
              {t('Manage Load Order')}
            </Toggle>
            <HelpBlock>
              {t('This will tell Vortex to enable plugin load order management via the load order page.')}
            </HelpBlock>
            <Toggle
              checked={enableDirectoryJunction}
              onToggle={onToggle}
            >
              {t('Use Folder Junction')}
            </Toggle>
            <HelpBlock>
              {t('This will allow you to enable/disable the use of folder junctions for the game.')}
            </HelpBlock>
          </Panel.Body>
        </Panel>
      </FormGroup>
    </form>
  );
}

function mapStateToProps(state: any): IConnectedProps {
  return {
    enableDirectoryJunction: util.getSafe(state, ['settings', 'starfield', 'enableDirectoryJunction'], false),
    manageLoadOrder: util.getSafe(state, ['settings', 'starfield', 'manageLoadOrder'], true),
  };
}