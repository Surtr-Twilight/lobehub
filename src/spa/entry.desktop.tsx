import { enableMapSet } from 'immer';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes } from 'react-router-dom';

import SPAGlobalProvider from '@/layout/GlobalProvider/SPAProvider';
import { desktopRoutes } from '@/routes/router/desktopRouter.config';
import { renderRoutes } from '@/utils/router';

enableMapSet();

const App = () => (
  <SPAGlobalProvider>
    <BrowserRouter>
      <Routes>{renderRoutes(desktopRoutes)}</Routes>
    </BrowserRouter>
  </SPAGlobalProvider>
);

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
