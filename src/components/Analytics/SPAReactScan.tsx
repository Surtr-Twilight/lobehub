'use client';

import { type FC } from 'react';
import { Monitoring } from 'react-scan/monitoring/react-router';

interface SPAReactScanProps {
  apiKey: string;
}

const SPAReactScan: FC<SPAReactScanProps> = ({ apiKey }) => (
  <Monitoring apiKey={apiKey} url="https://monitoring.react-scan.com/api/v1/ingest" />
);

export default SPAReactScan;
