import React from 'react';
import { Router } from '@reach/router';
import { routes } from 'general/routes/routes';
import analyticsService from 'analytics/analyticsService';
import events from 'analytics/events';
const withTracker = (WrappedComponent: any) => {
  class HOC extends React.Component<any> {
    render() {
      analyticsService.trackEventWithProperties(events.VISITED_PATH(this.props.path), { url: this.props.location.pathname });
      return (<WrappedComponent{...this.props} />);
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