import AboutPage from 'about/AboutPage';
import HomePage from 'home/HomePage';
import CartPage from 'cart/CartPage';
import MenuBrowserPage from 'menuBrowser/MenuBrowserPage';
import SignUpPage from 'account/SignUpPage';
import SignInPage from 'account/SignInPage';
import ReviewCartPage from 'cart/ReviewCartPage';
import AccountPage from 'account/AccountPage';

const routes = {
  about: {
    path: '/about',
    basePath: '/about',
    Component: AboutPage,
    getLink: () => '/about',
  },
  account: {
    path: '/me',
    basePath: '/me',
    Component: AccountPage,
    getLink: () => '/me',
  },
  cartFromOrder: {
    path: '/cart/:orderId',
    basePath: '/cart',
    Component: CartPage,
    getLink: (orderId: string) => `/cart/${orderId}`
  },
  cart: {
    path: '/cart',
    basePath: '/cart',
    Component: CartPage,
    getLink: () => '/cart',
  },
  home: {
    path: '/',
    basePath: '/',
    Component: HomePage,
    getLink: () => '/',
  },
  menuBrowser: {
    path: '/:restUrl',
    basePath: '/',
    Component: MenuBrowserPage,
    getLink: (restUrl: string) => `/${restUrl}`
  },
  reviewCart: {
    path: '/cart/review',
    basePath: '/cart',
    Component: ReviewCartPage,
    getLink: () => `/cart/review`
  },
  signIn: {
    path: '/sign-in',
    basePath: '/sign-in',
    Component: SignInPage,
    getLink: () => `/sign-in`
  },
  signUp: {
    path: '/sign-up',
    basePath: '/sign-up',
    Component: SignUpPage,
    getLink: () => `/sign-up`
  }
}

export {
  routes
}