import * as React from 'react';
import { Panel } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { NS } from '../common';

export default function StarfieldData() {
  const { t } = useTranslation(NS);
  return (
    <form>
      <Panel>
        <p>{t('The following data will be exported as part of your collection:')}</p>
        <ul>
          <li>Starfield extension version</li>
          <li>Your plugin load order</li>
        </ul>
      </Panel>
    </form>
  );
}