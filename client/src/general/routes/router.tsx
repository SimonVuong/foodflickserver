// @ts-nocheck
import React from 'react';
import { Router } from '@reach/router';
import { routes } from 'general/routes/routes';
import analyticsService from 'analytics/analyticsService';
const withTracker: any = (WrappedComponent: any) => {
  class HOC extends React.Component<any> {
    render() {
      analyticsService.trackEventWithProperties(`Viewed ${this.props.path}`, { 'actualPath': this.props.location.pathname });
      return (
        <WrappedComponent
          {...this.props}
        />
      );
    }
  }
  return HOC;
};

const MyRouter: React.FC = () => (
  <Router>
    {Object.values(routes).map(({ Component, path }, index) => {
      const HOC = withTracker(Component);
      return <HOC key={index} path={path} />
    })}
  </Router>
);


export default MyRouter;