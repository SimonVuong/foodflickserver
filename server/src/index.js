import "core-js/stable";
import "regenerator-runtime/runtime";
import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer } from 'http';
import { ApolloServer } from 'apollo-server-express';
import schema from './schema/schema';
import { getElastic } from './db/elasticConnector';
import Stripe from 'stripe';
import twilio from 'twilio';
import { getSignedInUser } from './utils/auth';
import { getRestService } from './services/restService';
import { getMenuService } from './services/menuService';
import { getUserService } from './services/userService'
import { getTagService } from './services/tagService';
import { getGeoService } from './services/geoService';
import { getBankingService } from './services/bankingService';
import { getCardService } from './services/cardService';
import { getOrderService } from './services/orderService';
import { activeConfig } from './config';
import { getPrinterService } from './services/printerService';
import { getBrokerService } from './services/brokerService';

const STRIPE_KEY = activeConfig.stripe.STRIPE_KEY;
const accountSid = activeConfig.twilio.accountSid;
const authToken = activeConfig.twilio.TWILIO_KEY;

const start = async () => {
  const app = express();
  //needed if since we run behind a heroku load balancer in prod
  if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      if (req.header('x-forwarded-proto') !== 'https') {
        res.redirect('https://' + req.header('host') + req.url);
      } else {
        next();
      }
    });
  }

  const elastic = await getElastic();
  const textClient = twilio(accountSid, authToken);
  const stripe = new Stripe(STRIPE_KEY);
  const apolloServer = new ApolloServer({
    schema,
    context: ({ req }) => ({
      signedInUser: getSignedInUser(req),
      BankingService: getBankingService(stripe),
      CardService: getCardService(stripe),
      RestService: getRestService(elastic),
      MenuService: getMenuService(elastic),
      OrderService: getOrderService(stripe, elastic, textClient),
      UserService: getUserService(elastic),
      TagService: getTagService(elastic),
      GeoService: getGeoService(),
    }),
  });

  apolloServer.applyMiddleware({ app })
  const webServer = createServer(app);

  const broker = await getBrokerService();
  const printerService = getPrinterService(broker);
  printerService.openReceiverRegistration(webServer);

  app.use(cors());
  // this is a workaround for https://github.com/react-native-community/react-native-webview/issues/428
  app.get('/card', (req, res) => {
    res.sendFile(path.join(__dirname + activeConfig.stripe.cardPath));
  });
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  // must use http.createServer instead of https.createServer because
  // https://stackoverflow.com/questions/41488602/heroku-connection-closed-code-h13
  // webServer.timeout = 0; //

  
  const port = activeConfig.app.port;
  webServer.listen(port, () => {
    console.log(`API Server is now running at https://localhost:${port}${apolloServer.graphqlPath}`);
  });
};

start();