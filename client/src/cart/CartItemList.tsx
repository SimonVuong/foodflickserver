import React from 'react';
import { makeStyles, Theme } from '@material-ui/core/styles';
import { RootState } from 'general/redux/rootReducer';
import { connect } from 'react-redux';
import { Typography, Card, CardContent, CardMedia, Button, useMediaQuery } from '@material-ui/core';
import { useTheme } from '@material-ui/styles';
import { CartStateReducer } from 'general/order/redux/cartReducer';

const useStyles = makeStyles((theme: Theme) => ({
  remove: {
    paddingLeft: 0,
    zIndex: 1, // so it takes priority over clicking the card
  },
  cardContent: {
    padding: '0px !important',
  },
  card: {
    display: 'flex',
    paddingRight: theme.spacing(1),
    cursor: ({ onClickCard }: props) => onClickCard ? 'pointer' : 'initial',
  },
  section: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    paddingLeft: theme.spacing(1),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
  img: {
    width: '20%',
    alignSelf: 'stretch',
  },
}));

type props = {
  cart: CartStateReducer,
  onRemoveCartItem?: (itemIndex: number) => void,
  onClickCard?: (itemIndex: number) => void,
};

const CartItemList: React.FC<props> = props => {
  const { cart, onRemoveCartItem, onClickCard } = props;
  const classes = useStyles(props);
  const theme: Theme = useTheme();
  const isXSmall = useMediaQuery(theme.breakpoints.down('xs'));
  const textStyle: any = {};
  const handleCardClick = (cartIndex: number) => {
    if (onClickCard) onClickCard(cartIndex);
  };
  const onClickRemove = (e: React.MouseEvent<HTMLButtonElement>, index: number) => {
    if (onRemoveCartItem) {
      e.stopPropagation();
      onRemoveCartItem(index);
    }
  }
  if (isXSmall) {
    textStyle.lineHeight = 'normal';
  }
  if (!cart) return null;
  return (
    <>
      {cart.Items.map((item, index) => (
        <Card key={index} className={classes.card} onClick={() => handleCardClick(index)}>
          <CardMedia className={classes.img} image={item.Flick}  title={item.Name} />
          <div className={classes.section}>
            <CardContent className={classes.cardContent}>
              <Typography variant='subtitle1' style={textStyle}>{item.Name}</Typography>
              <Typography variant='subtitle2'>{item.SelectedPrice.valueLabelString}</Typography>
              <Typography variant='body2' color='textSecondary'>Qty: {item.Quantity}</Typography>
              {onRemoveCartItem &&
                <Button
                  color='secondary'
                  className={classes.remove}
                  onClick={e => onClickRemove(e, index)}
                >
                  Remove
                </Button>
              }
            </CardContent>
          </div>
          <div className={classes.section}>
            <CardContent className={classes.cardContent}>
              {(item.SelectedOptions.length > 0 || !!item.SpecialRequests) && 
                <Typography variant='body2' color='textSecondary' style={textStyle}>
                  {item.SelectedOptions.map((option, index) => (
                    index === 0 ? option.Name : `, ${option.Name}`
                  ))}
                  {item.SelectedOptions.length > 0 && item.SpecialRequests ? `, ${item.SpecialRequests}` : item.SpecialRequests}
                </Typography>
              }
            </CardContent>
          </div>
        </Card>
      ))}
    </>
  );
}

const mapStateToProps = (state: RootState) => ({
  cart: state.OrderingFlow.cart,
});

export default connect(mapStateToProps)(CartItemList);
