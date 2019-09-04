import React from 'react';
import TextFieldWithStripeElement from './TextFieldWithStripeElement';
import { CardCVCElement, CardExpiryElement, CardNumberElement } from 'react-stripe-elements';
import { makeStyles } from '@material-ui/styles';
import { Theme } from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) => ({
  row: {
    display: 'flex',
  },
  expiry: {
    marginRight: theme.spacing(2),
  },
  cvc: {
    marginLeft: theme.spacing(2)
  },
}));

/**
 * PARENT MUST HAVE <StripeProvder> and <Elements>
 */
const CardForm: React.FC = () => {
  const classes = useStyles();
  return (
    <> 
      <TextFieldWithStripeElement StripeElement={CardNumberElement} label='Number' />
      <div className={classes.row}>
        <TextFieldWithStripeElement StripeElement={CardExpiryElement} label='Expiry' className={classes.expiry} />
        <TextFieldWithStripeElement StripeElement={CardCVCElement} label='CVC' className={classes.cvc} />
      </div>
    </>
  );
}

export default CardForm;
