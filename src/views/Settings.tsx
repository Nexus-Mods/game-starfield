import * as React from 'react';
import { ControlLabel, FormGroup, Panel, HelpBlock } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Toggle } from 'vortex-api';

import { NS, JUNCTION_TEXT } from '../common';

interface IBaseProps {
  onSetDirectoryJunction: (enabled: boolean) => void;
}

interface IConnectedProps {
  enableDirectoryJunction: boolean;
}

type IProps = IBaseProps;

export default function Settings(props: IProps) {
  const { t } = useTranslation(NS);
  const { onSetDirectoryJunction } = props;
  const onToggle = React.useCallback((newVal) => {
    onSetDirectoryJunction(newVal);
  }, [onSetDirectoryJunction])
  const { enableDirectoryJunction } = useSelector(mapStateToProps);
  return (
    <form>
      <FormGroup controlId='default-enable'>
        <Panel>
          <Panel.Body>
            <ControlLabel>{t('Starfield')}</ControlLabel>
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
    enableDirectoryJunction: state.settings.starfield.enableDirectoryJunction,
  };
}