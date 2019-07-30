import "core-js/stable";
import "regenerator-runtime/runtime";
import express from 'express';
import path  from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';
// Subs
import { execute, subscribe } from 'graphql'
import { SubscriptionServer } from 'subscriptions-transport-ws';
import schema from './schema/schema';
import { getElastic } from './db/elasticConnector';
import Stripe from 'stripe'; 
import { getSignedInUser } from './utils/auth';
import UserService from './services/userService';
import { getRestService } from './services/restService';
import { getMenuService } from './services/menuService';
import { getUserService } from './services/userService'
import { getTagService } from './services/tagService';
import { getGeoService } from './services/geoService';
import { getBankingService } from './services/bankingService';
import { getCardService } from './services/cardService';
import { getOrderService } from './services/orderService';
import { activeConfig } from './config';
import { readFileSync } from 'fs';

const STRIPE_KEY = activeConfig.stripe.STRIPE_KEY;

const start = async () => {
  const app = express();
  app.use(cors());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  const elastic = await getElastic();
  const stripe = new Stripe(STRIPE_KEY);
  app.use('/graphql', graphqlExpress(async (req) => ({
    context: {
      signedInUser: getSignedInUser(req),
      BankingService: getBankingService(stripe),
      CardService: getCardService(stripe),
      RestService: getRestService(elastic),
      MenuService: getMenuService(elastic),
      OrderService: getOrderService(stripe),
      UserService: getUserService(elastic),
      TagService: getTagService(elastic),
      GeoService: getGeoService(),
    },
    schema
  })));

  app.use('/graphiql', graphiqlExpress({
    endpointURL: '/graphql',
  }));

  // this is a workaround for https://github.com/react-native-community/react-native-webview/issues/428
  app.get('/card', function(req, res) {
    res.sendFile(path.join(__dirname + activeConfig.stripe.cardPath));
  });
  app.use(express.static(path.join(__dirname, 'public')));


  // const secureServer = createServer({
  //   ca: readFileSync(path.join(__dirname, 'foodflick_co.ca-bundle')),
  //   cert: readFileSync(path.join(__dirname, 'foodflick_co.crt')),
  //   key: readFileSync(path.join(__dirname, 'foodflickco.key')),
  // }, app)
  // must use http.createServer instead of https.createServer because
  // https://stackoverflow.com/questions/41488602/heroku-connection-closed-code-h13
  const secureServer = createServer(app);

  const port = activeConfig.app.port;
  
  secureServer.listen(port, () => {
    console.log(`API Server is now running on port ${port}`)
  });

  // Subs
  // const SUBSCRIPTIONS_PATH = '/subscriptions';
  // SubscriptionServer.create(
  //   {
  //     schema,
  //     execute,
  //     subscribe,
  //   },
  //   {
  //     server,
  //     path: SUBSCRIPTIONS_PATH,
  //   }
  // );
};

start();

// const fs = require('fs');
// const https = require('https');
// const express = require('')