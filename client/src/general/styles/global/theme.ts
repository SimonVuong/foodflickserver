import { NotificationTypes } from 'general/redux/ui/notification/notificationReducer';
import { createMuiTheme, Theme } from "@material-ui/core";
import { ThemeOptions } from "@material-ui/core/styles/createMuiTheme";

const blush = '#9d5458';
const lightGray = '#f5f5f5';
const charcoal = '#3c3c3c';
const leafGreen = '#536a4f';
const powerGreen = '#3d9241';
const powerOrange = '#ffa000';
const powerRed = '#f44336'
const white = "#ffffff";

const brandBase = white;
const brandPrimary = leafGreen; // used to be scarlet
const brandPrimaryOpacity = (opacity: number) => `rgba(83, 106, 79, ${opacity})` 
const brandInfo = blush;
const brandInfoLightOpacity = (opacity: number) => `rgba(235, 220, 221, ${opacity})`
const brandInfoDarkOpacity = (opacity: number) => `rgba(109, 58, 61, ${opacity})`
const brandText = charcoal;
const brandLoading = '#5E859A';
const brandCanvas = lightGray;
const brandSuccess = powerGreen;
const brandError = powerRed;
const brandWarning = powerOrange;

const theme: ThemeOptions = {
  breakpoints: {
    keys: [
      'xs',
      'sm',
      'md',
      'lg',
      'xl'
    ],
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920
    }
  },
  direction: 'ltr',
  mixins: {
    navbar: {
      marginBottom: 24,
    },
    drawer: {
      width: 180,
    },
    toolbar: {
      minHeight: 56,
      '@media (min-width:0px) and (orientation: landscape)': {
        minHeight: 48
      },
      '@media (min-width:600px)': {
        minHeight: 64
      },
    }
  },
  overrides: {
    MuiAppBar: {
      colorDefault: {
        backgroundColor: brandBase,
      },
    },
    MuiButton: {
      containedPrimary: {
        color: white,
      }
    },
    MuiContainer: {
      root: {
        backgroundColor: white
      },
    },
    MuiFilledInput: {
      root: {
        backgroundColor: white,
        '&:hover': {
          backgroundColor: white,
        },
        '&.Mui-focused': {
          backgroundColor: white,
        }
      },
      underline: {
        '&:before': {
          borderBottom: `1px solid ${brandPrimary}`
        },
        '&:after': {
          borderBottom: `2px solid ${brandPrimary}`
        },
        '&:hover:before': {
          borderBottom: `1px solid `
        },
      }
    },
    //@ts-ignore
    MuiToggleButton: {
      root: {
        flex: 1,
        color: brandInfo,
        backgroundColor: white,
        '&:hover': {
          color: brandInfo,
          backgroundColor: brandInfoLightOpacity(0.87),
        },
        '&.Mui-selected:hover': {
          backgroundColor: `${brandInfoDarkOpacity(0.87)} !important`,
        },
        '&.Mui-selected': {
          color: white,
          backgroundColor: brandInfo,
        },
        '&:not(:first-child)': {
          borderLeft: undefined,
        },
      }
    },
  },
  palette: {
    common: {
      black: '#000',
      white: white,
      brandPrimaryOpacity,
      success: brandSuccess,
      warning: brandWarning,
      error: brandError,
      loading: brandLoading,
    },
    type: 'light',
    primary: {
      // commented out so mui auto generates light + dark
      // light: '#7986cb',
      main: brandPrimary,
      // dark: '#303f9f',
      contrastText: brandText
    },
    secondary: {
      // light: '#ff4081',
      main: brandInfo,
      // dark: '#c51162',
      contrastText: '#fff'
    },
    error: {
      light: '#e57373',
      main: brandError,
      dark: '#d32f2f',
      contrastText: '#fff'
    },
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
      A100: '#d5d5d5',
      A200: '#aaaaaa',
      A400: '#303030',
      A700: '#616161'
    },
    contrastThreshold: 3,
    tonalOffset: 0.2,
    text: {
      primary: brandText,
      secondary: 'rgba(0, 0, 0, 0.54)',
      disabled: 'rgba(0, 0, 0, 0.38)',
      hint: 'rgba(0, 0, 0, 0.38)'
    },
    divider: 'rgba(0, 0, 0, 0.12)',
    background: {
      paper: '#fff',
      default: brandCanvas,
    },
    action: {
      active: 'rgba(0, 0, 0, 0.54)',
      hover: 'rgba(0, 0, 0, 0.08)',
      hoverOpacity: 0.08,
      selected: 'rgba(0, 0, 0, 0.14)',
      disabled: 'rgba(0, 0, 0, 0.26)',
      disabledBackground: 'rgba(0, 0, 0, 0.12)'
    }
  },
  props: {},
  shadows: [
    'none',
    '0px 1px 3px 0px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 2px 1px -1px rgba(0,0,0,0.12)',
    '0px 1px 5px 0px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 3px 1px -2px rgba(0,0,0,0.12)',
    '0px 1px 8px 0px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 3px 3px -2px rgba(0,0,0,0.12)',
    '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
    '0px 3px 5px -1px rgba(0,0,0,0.2),0px 5px 8px 0px rgba(0,0,0,0.14),0px 1px 14px 0px rgba(0,0,0,0.12)',
    '0px 3px 5px -1px rgba(0,0,0,0.2),0px 6px 10px 0px rgba(0,0,0,0.14),0px 1px 18px 0px rgba(0,0,0,0.12)',
    '0px 4px 5px -2px rgba(0,0,0,0.2),0px 7px 10px 1px rgba(0,0,0,0.14),0px 2px 16px 1px rgba(0,0,0,0.12)',
    '0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)',
    '0px 5px 6px -3px rgba(0,0,0,0.2),0px 9px 12px 1px rgba(0,0,0,0.14),0px 3px 16px 2px rgba(0,0,0,0.12)',
    '0px 6px 6px -3px rgba(0,0,0,0.2),0px 10px 14px 1px rgba(0,0,0,0.14),0px 4px 18px 3px rgba(0,0,0,0.12)',
    '0px 6px 7px -4px rgba(0,0,0,0.2),0px 11px 15px 1px rgba(0,0,0,0.14),0px 4px 20px 3px rgba(0,0,0,0.12)',
    '0px 7px 8px -4px rgba(0,0,0,0.2),0px 12px 17px 2px rgba(0,0,0,0.14),0px 5px 22px 4px rgba(0,0,0,0.12)',
    '0px 7px 8px -4px rgba(0,0,0,0.2),0px 13px 19px 2px rgba(0,0,0,0.14),0px 5px 24px 4px rgba(0,0,0,0.12)',
    '0px 7px 9px -4px rgba(0,0,0,0.2),0px 14px 21px 2px rgba(0,0,0,0.14),0px 5px 26px 4px rgba(0,0,0,0.12)',
    '0px 8px 9px -5px rgba(0,0,0,0.2),0px 15px 22px 2px rgba(0,0,0,0.14),0px 6px 28px 5px rgba(0,0,0,0.12)',
    '0px 8px 10px -5px rgba(0,0,0,0.2),0px 16px 24px 2px rgba(0,0,0,0.14),0px 6px 30px 5px rgba(0,0,0,0.12)',
    '0px 8px 11px -5px rgba(0,0,0,0.2),0px 17px 26px 2px rgba(0,0,0,0.14),0px 6px 32px 5px rgba(0,0,0,0.12)',
    '0px 9px 11px -5px rgba(0,0,0,0.2),0px 18px 28px 2px rgba(0,0,0,0.14),0px 7px 34px 6px rgba(0,0,0,0.12)',
    '0px 9px 12px -6px rgba(0,0,0,0.2),0px 19px 29px 2px rgba(0,0,0,0.14),0px 7px 36px 6px rgba(0,0,0,0.12)',
    '0px 10px 13px -6px rgba(0,0,0,0.2),0px 20px 31px 3px rgba(0,0,0,0.14),0px 8px 38px 7px rgba(0,0,0,0.12)',
    '0px 10px 13px -6px rgba(0,0,0,0.2),0px 21px 33px 3px rgba(0,0,0,0.14),0px 8px 40px 7px rgba(0,0,0,0.12)',
    '0px 10px 14px -6px rgba(0,0,0,0.2),0px 22px 35px 3px rgba(0,0,0,0.14),0px 8px 42px 7px rgba(0,0,0,0.12)',
    '0px 11px 14px -7px rgba(0,0,0,0.2),0px 23px 36px 3px rgba(0,0,0,0.14),0px 9px 44px 8px rgba(0,0,0,0.12)',
    '0px 11px 15px -7px rgba(0,0,0,0.2),0px 24px 38px 3px rgba(0,0,0,0.14),0px 9px 46px 8px rgba(0,0,0,0.12)'
  ],
  typography: {
    htmlFontSize: 16,
    fontFamily: '\'Roboto\', \'Helvetica\', \'Arial\', sans-serif',
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    h1: {
      fontFamily: '\'Roboto\', \'Helvetica\', \'Arial\', sans-serif',
      fontWeight: 300,
      fontSize: '6rem',
      lineHeight: 1,
      letterSpacing: '-0.01562em'
    },
    h2: {
      fontFamily: '\'Roboto\', \'Helvetica\', \'Arial\', sans-serif',
      fontWeight: 300,
      fontSize: '3.75rem',
      lineHeight: 1,
      letterSpacing: '-0.00833em'
    },
    h3: {
      fontFamily: '\'Roboto\', \'Helvetica\', \'Arial\', sans-serif',
      fontWeight: 400,
      fontSize: '3rem',
      lineHeight: 1.04,
      letterSpacing: '0em'
    },
    h4: {
      fontFamily: '\'Roboto\', \'Helvetica\', \'Arial\', sans-serif',
      fontWeight: 400,
      fontSize: '2.125rem',
      lineHeight: 1.17,
      letterSpacing: '0.00735em'
    },
    h5: {
      fontFamily: '\'Roboto\', \'Helvetica\', \'Arial\', sans-serif',
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.33,
      letterSpacing: '0em'
    },
    h6: {
      fontFamily: '\'Roboto\', \'Helvetica\', \'Arial\', sans-serif',
      fontWeight: 500,
      fontSize: '1.25rem',
      lineHeight: 1.6,
      letterSpacing: '0.0075em'
    },
    subtitle1: {
      fontFamily: '\'Roboto\', \'Helvetica\', \'Arial\', sans-serif',
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.75,
      letterSpacing: '0.00938em'
    },
    subtitle2: {
      fontFamily: '\'Roboto\', \'Helvetica\', \'Arial\', sans-serif',
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: 1.57,
      letterSpacing: '0.00714em'
    },
    body1: {
      fontFamily: '\'Roboto\', \'Helvetica\', \'Arial\', sans-serif',
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '0.00938em'
    },
    body2: {
      fontFamily: '\'Roboto\', \'Helvetica\', \'Arial\', sans-serif',
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: 1.43,
      letterSpacing: '0.01071em'
    },
    button: {
      fontFamily: '\'Roboto\', \'Helvetica\', \'Arial\', sans-serif',
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.75,
      letterSpacing: '0.02857em',
      textTransform: 'uppercase'
    },
    caption: {
      fontFamily: '\'Roboto\', \'Helvetica\', \'Arial\', sans-serif',
      fontWeight: 400,
      fontSize: '0.75rem',
      lineHeight: 1.66,
      letterSpacing: '0.03333em'
    },
    overline: {
      fontFamily: '\'Roboto\', \'Helvetica\', \'Arial\', sans-serif',
      fontWeight: 400,
      fontSize: '0.75rem',
      lineHeight: 2.66,
      letterSpacing: '0.08333em',
      textTransform: 'uppercase'
    }
  },
  shape: {
    borderRadius: 4
  },
  transitions: {
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
    },
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195
    }
  },
  zIndex: {
    mobileStepper: 1000,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500
  }
}

declare module "@material-ui/core/colors/common" {
  interface CommonColors {
    brandPrimaryOpacity: (opacity: number) => string;
    loading: string;
    [NotificationTypes.success]: string;
    [NotificationTypes.warning]: string;
    [NotificationTypes.error]: string;
  }
}

declare module "@material-ui/core/styles/createMixins" {
  interface Mixins {
    navbar: {
      marginBottom: number
    };
    drawer: {
      width: number
    }
  }
}

let muiTheme: Theme;
const getTheme = () => {
  if (muiTheme) return muiTheme;
  //@ts-ignore
  muiTheme = createMuiTheme(theme);
  return muiTheme;
}

export {
  getTheme
}