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
          foodflick is a point of sale add-on for restaurants that lives in the customer's phone. It integrates with
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
        <Typography variant='body1' gutterBottom paragraph>
          foodflick is also working to integrate with delivery services like Grubhub or Uber Eats so these orders display
          or print in your kitchen in real-time. This automatic and hands-free service allows you to process orders faster
          and without errors. This service is included for free with all subscription plans.
        </Typography>
        <Typography variant='h6' gutterBottom>
          Interested?
        </Typography>
        <Typography variant='body1' paragraph>
          Download foodflick on android or iOS to add your restaurant and start with our free plan!
          <b> You get 1000 orders on a month on foodflick for free, then foodflick charges 3% per order. Custom pricing available on
          request</b>. Contact me (Simon) at <b> 609-513-8166</b> or <b> sales.foodflick@gmail.com</b> to request a restaurant addition or just to chat.
        </Typography>
        <Typography variant='h6' gutterBottom>
          How does it work?
        </Typography>
        <Typography variant='body1' gutterBottom paragraph>
          When customers sit down, the server greets them, informs them about foodflick, and performs other
          introductions like sharing features or specials. Each diner then scans a QR code on the table.
          This brings up the <i> foodflick website </i>with your menu on the customer's phone, at which
          point they browse with pictures, place their order, and set their tip. (Tip is adjustable later).
        </Typography>
        <Typography variant='body1' gutterBottom paragraph>
          This immediately prints an order in the kitchen (additional printers available with configuration via the
          <i> foodflick management app</i>). Because orders may contain unsupported special requests, servers can void
          and return orders to the customer when the kitchen receives an invalid ticket. This sends a text
          to the customer so they can modify it, but a server should probably also notify the diner.
        </Typography>
        <Typography variant='body1' gutterBottom paragraph>
          Assuming the order is okay, foodflick then places the order in an OPEN status for 15 minutes (configurable).
          This specific order now works like an open tab for 15 minutes. Orders by the same person with the same card,
          phone, and table number are all added to the same order to reduce your transaction costs. After the 15 minutes,
          The order moves into TIPPING status and remains there for the next 3 hours. This gives customers a chance to
          update their tip after their meal. Finally, after the 3 hours the customer is charged and the transaction is
          complete.
        </Typography>
        <Typography variant='body1' gutterBottom paragraph>
          If the customer is unsatisfied after receiving his or her order, a manager can use the foodflick management app
          to return the order if it's in a TIPPING status or issue a refund if the transaction has completed. The management
          app is available only to restaurant staff and can also be used to update the restaurant details and menu.
        </Typography>
        <Typography variant='h6' gutterBottom>
          FAQ
        </Typography>
        <Typography variant='subtitle1' gutterBottom>
          <i>What if we don't want to replace our POS?</i>
        </Typography>
        <Typography variant='body1' gutterBottom paragraph>
          No worries! We at foodflick understand that POS ecosystems are difficult to swap. That's why we're an add-on.
          We integrate with your existing POS.
        </Typography>
        <Typography variant='subtitle1' gutterBottom>
          <i>My POS doesn't use printers. How will foodflick work?</i>
        </Typography>
        <Typography variant='body1'gutterBottom paragraph>
          We are well aware that some restaurants have ditched printers in favor of digital screens. We don't support
          this right now, but we would love for the opportunity work with you and your POS system to integrate foodflick.
          As a token of our gratitude, we'll agree on a custom pricing plan that works for both of us.
        </Typography>
        <Typography variant='subtitle1' gutterBottom>
          <i>What about service? If customers order through foodflick, do they still need servers?</i>
        </Typography>
        <Typography variant='body1' gutterBottom paragraph>
          Yes, 100%. Throughout the meal, it is vital that the server still provides good service by checking in on the
          diner and fulfilling other requests. foodflick aims to streamline and improve service, not remove it.
        </Typography>
      </div>
    </div>
  )
}

export default AboutPage