import { enableMapSet } from 'immer';

enableMapSet();

import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes } from 'react-router-dom';

import SPAGlobalProvider from '@/layout/GlobalProvider/SPAProvider';
import { mobileRoutes } from '@/routes/(mobile)/router/mobileRouter.config';
import { renderRoutes } from '@/utils/router';

const App = () => (
  <SPAGlobalProvider>
    <BrowserRouter>
      <Routes>{renderRoutes(mobileRoutes)}</Routes>
    </BrowserRouter>
  </SPAGlobalProvider>
);

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
