import AboutPage from 'about/AboutPage';
import HomePage from 'home/HomePage';
import CartPage from 'cart/CartPage';
import MenuBrowserPage from 'menuBrowser/MenuBrowserPage';
import SignUpPage from 'account/SignUpPage';
import SignInPage from 'account/SignInPage';
import ReviewCartPage from 'cart/ReviewCartPage';
import AccountPage from 'account/AccountPage';
import CompletedOrderSummaryPage from 'account/OrderSummaryPage';

const routes = {
  about: {
    path: '/about',
    basePath: '/about',
    Component: AboutPage,
    componentName: 'AboutPage',
    getLink: () => '/about',
  },
  account: {
    path: '/me',
    basePath: '/me',
    Component: AccountPage,
    componentName: 'AccountPage',
    getLink: () => '/me',
  },
  orderSummary: {
    path: '/order/:orderId',
    basePath: '/order',
    Component: CompletedOrderSummaryPage,
    componentName: 'CompletedOrderSummaryPage',
    getLink: (orderId: string) => `/order/${orderId}`,
  },
  cartFromOrder: {
    path: '/cart/:orderId',
    basePath: '/cart',
    Component: CartPage,
    componentName: 'CartPage',
    getLink: (orderId: string) => `/cart/${orderId}`
  },
  cart: {
    path: '/cart',
    basePath: '/cart',
    Component: CartPage,
    componentName: 'CartPage',
    getLink: () => '/cart',
  },
  home: {
    path: '/',
    basePath: '/',
    Component: HomePage,
    componentName: 'HomePage',
    getLink: () => '/',
  },
  menuBrowser: {
    path: '/:restUrl',
    basePath: '/',
    Component: MenuBrowserPage,
    componentName: 'MenuBrowserPage',
    getLink: (restUrl: string) => `/${restUrl}`
  },
  reviewCart: {
    path: '/cart/review',
    basePath: '/cart',
    Component: ReviewCartPage,
    componentName: 'ReviewCartPage',
    getLink: () => `/cart/review`
  },
  signIn: {
    path: '/sign-in',
    basePath: '/sign-in',
    Component: SignInPage,
    componentName: 'SignInPage',
    getLink: () => `/sign-in`
  },
  signUp: {
    path: '/sign-up',
    basePath: '/sign-up',
    Component: SignUpPage,
    componentName: 'SignUpPage',
    getLink: () => `/sign-up`
  }
}

export {
  routes
}