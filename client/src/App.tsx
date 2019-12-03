import React, { useEffect, useState } from 'react';
import { ApolloProvider } from '@apollo/react-hooks';
import { Store } from 'redux';
import ApolloClient from 'apollo-client';
import { Provider } from 'react-redux'
import { initStore } from 'general/redux/store';
import { getApolloClient } from 'apolloClient';
import { NormalizedCacheObject } from 'apollo-cache-inmemory';
import { getRootReducer } from 'general/redux/rootReducer';
import Navbar from 'general/components/global/Navbar';
import { getTheme } from 'general/styles/global/theme';
import { ThemeProvider } from '@material-ui/styles';
import Router from 'general/routes/router';
import Notifier from 'general/components/global/Notifier';
import { signInWithRefreshAction, STORAGE_KEY } from 'general/account/accountActions';
import AnalyticsService from './analytics/analyticsService';

const store: Store = initStore(getRootReducer());
const apolloClient: ApolloClient<NormalizedCacheObject> = getApolloClient(store);
const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    const refreshToken = localStorage.getItem(STORAGE_KEY);
    AnalyticsService.init().then(() => setIsReady(true))
    // @ts-ignore
    if (refreshToken) store.dispatch(signInWithRefreshAction(refreshToken));
  }, []);

  if (!isReady) return null;

  return (
    <ApolloProvider client={apolloClient}>
      <Provider store={store}>
        <ThemeProvider theme={getTheme()}>
          <Navbar />
          <Router />
          <Notifier />
        </ThemeProvider>
      </Provider>
    </ApolloProvider>
  );
};

export default App;
