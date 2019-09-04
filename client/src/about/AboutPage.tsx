import React from 'react';
import { RouteComponentProps } from '@reach/router';
import { Theme, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
const background = '/assets/global/background.jpg';

const useStyles = makeStyles((theme: Theme) => ({
  content: {
    padding: 20,
    backgroundColor: theme.palette.background.default,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
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
          foodflick is a mobile point of sale for restaurants that lives in the customer's phone. foodflick handles
          payments, menu management, and more. Customers, use foodflick to browse the menu and place orders. No more waiting for checks. No more splitting bills.
          Restaurants, improve customer service. Servers focus less on bookkeeping and more on what counts, the customer.
        </Typography>
        <Typography variant='h6' gutterBottom>
          Interested?
        </Typography>
        <Typography variant='body1'>
          Download foodflick in the playstore to add your restaurant! Contact me (Simon) at <i> 609-513-8166</i> or
          <i> simonlvuong@gmail.com</i> to request a restaurant addition or just to chat.
        </Typography>
      </div>
    </div>
  )
}

export default AboutPage