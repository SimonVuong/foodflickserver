import React from 'react';
import { Router } from '@reach/router';
import { routes } from 'general/routes/routes';

const MyRouter: React.FC = () => (
  <Router>
    {Object.values(routes).map(({ Component, path }, index) => <Component path={path} key={index} />)}
  </Router>
);

export default MyRouter;