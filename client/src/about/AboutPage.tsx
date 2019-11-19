import React from 'react';
import { RouteComponentProps } from '@reach/router';
import { Theme, Link, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { Link as RouterLink } from '@reach/router';
import { routes } from 'general/routes/routes';

const background = '/assets/global/background.jpg';

const useStyles = makeStyles((theme: Theme) => ({
  content: {
    padding: 20,
    backgroundColor: theme.palette.background.default,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  link: {
    textDecoration: 'underline',
  },
  background: {
    paddingTop: '10vh',
    marginTop: -theme.mixins.navbar.marginBottom,
    backgroundPosition: 'bottom',
    backgroundImage: `url(${background})`,
    backgroundSize: 'cover',
  }
}));

const AboutPage: React.FC<RouteComponentProps> = () => {
  const classes = useStyles();
  return (
    <div className={classes.background}>
      <div className={classes.content}>
        <Typography variant='h6' gutterBottom>
          What is foodflick?
      </Typography>
        <Typography variant='body1' paragraph>
          foodflick is a mobile point of sale add-on for restaurants that lives in the customer's phone. It integrates with
          your POS. foodflick handles payments, menu management, and more. Sit-down customers use foodflick to browse
          the menu and place orders. No more waiting for checks. No more splitting bills. This improves customer service
          by allowing servers focus less on bookkeeping and more on what counts, the customer. Check out our&nbsp;
          <Link
            className={classes.link}
            color='secondary'
            component={RouterLink}
            to={routes.menuBrowser.getLink('_demo')}
          >
            demo restaurant.
          </Link>
        </Typography>
        <Typography variant='h6' gutterBottom>
          Interested?
        </Typography>
        <Typography variant='body1'>
          Download foodflick on android or iOS to add your restaurant and start with our free plan! You get 1000 orders
          a month for free, then foodflick charges 3% per order. Custom pricing available on request. Contact me (Simon)
          at <i> 609-513-8166</i> or <i> sales.foodflick@gmail.com</i> to request a restaurant addition or just to chat.
        </Typography>
      </div>
    </div>
  )
}

export default AboutPage