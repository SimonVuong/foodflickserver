import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';
import Close from '@material-ui/icons/Close';
import Add from '@material-ui/icons/AddCircleOutline';
import Remove from '@material-ui/icons/RemoveCircleOutline';
import { Grow, Typography, useMediaQuery, Theme, FormControl, FormLabel, RadioGroup, Radio, FormControlLabel, TextField, Button, FormGroup, Checkbox } from '@material-ui/core';
import { CustomerItem } from 'general/menu/models/CustomerItemModel';
import { useTheme } from '@material-ui/styles';
import { Price, Option, Addon } from 'general/menu/models/BaseItemModel';

type selectedAddons = {
  [key: string]: boolean
};

type props = {
  confirmText: string,
  item: CustomerItem,
  defaultAddons?: selectedAddons,
  defaultQuantity?: number,
  defaultSelectedPriceIndex?: number,
  defaultSelectedOptionIndexes?: number[],
  defaultSpecialRequests?: string,
  onConfirm: (
    selectedPrice: Price,
    selectedOptions: Option[],
    selectedAddons: Addon[],
    quantity: number,
    specialRequests?: string,
  ) => void,
  onClose: () => void,
  open: boolean,
}
const useStyles = makeStyles(theme => ({
  button: {
    marginTop: theme.spacing(2),
  },
  pointer: {
    cursor: 'pointer',
  },
  img: {
    objectFit: 'cover',
    width: '100%',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2)
  },
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  quantityRow: {
    display: 'flex',
    alignItems: 'center',
    marginTop: theme.spacing(2),
  },
  quantityInput: {
    width: 50,
    padding: theme.spacing(0, 1),
  },
  howMany: {
    paddingRight: theme.spacing(1),
  },
  formControl: {
    marginTop: theme.spacing(2),
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  singlePrice: {
    ...theme.typography.subtitle1,
    paddingLeft: theme.spacing(1),
    fontWeight: theme.typography.fontWeightBold,
  },
  paper: {
    height: '80%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2),
    overflowY: 'scroll',
  },
}));

const CartItemModal: React.FC<props> = ({
  confirmText,
  item,
  defaultAddons,
  defaultSelectedPriceIndex,
  defaultQuantity,
  defaultSelectedOptionIndexes,
  defaultSpecialRequests,
  onClose,
  onConfirm,
  open
}) => {
  const classes = useStyles();
  const theme: Theme = useTheme();
  const [selectedPriceIndex, setSelectedPriceIndex] = useState(defaultSelectedPriceIndex || 0);
  const [quantity, setQuantity] = useState(defaultQuantity || 1);
  const [selectedAddons, setSelectedAddons] = useState<selectedAddons>(defaultAddons || {});
  const [selectedGroupIndexes, setSelectedGroupIndexes ] = useState(
    defaultSelectedOptionIndexes || Array(item.OptionGroups.length).fill(0)
  );
  const [specialRequests, setSpecialRequests] = useState<string | undefined>(defaultSpecialRequests);
  const isXSmall = useMediaQuery(theme.breakpoints.down('xs'));
  const paperStyle = {
    width: isXSmall ? '100%' : '80%',
  };
  const imgStyle = {
    maxHeight: isXSmall ? 150 : 300,
  }
  const increaseQuantity = () => setQuantity(quantity + 1);
  const decreaseQuantity = () => {
    if (quantity === 1) return;
    setQuantity(quantity - 1);
  };
  const onClickConfirm = () => {
    onClose();
    const addons: Addon[] = [];
    Object.entries(selectedAddons).forEach(([addonIndex, shouldIncludeAddon]) => {
      if (shouldIncludeAddon) addons.push(item.addons[parseFloat(addonIndex)]);
    });
    onConfirm(
      item.Prices[selectedPriceIndex],
      item.OptionGroups.map((group, index) => group.Options[selectedGroupIndexes[index]]),
      addons,
      quantity,
      specialRequests
    )
  }
  return (
    <Modal className={classes.modal} open={open} onClose={onClose}>
      <Grow in={open}>
        <div className={classes.paper} style={paperStyle}>
          <Close onClick={onClose} className={classes.pointer} />
          {
            item.Flick &&
            <img
              src={item.Flick}
              alt={item.Name}
              className={classes.img}
              style={imgStyle}
            />
          }
          <div className={classes.name}>
            <Typography variant='h5'>{item.Name}</Typography>
            {/* <div>{item.likes.count}</div> */}
          </div>
          <Typography variant='body1'>{item.Description}</Typography>
          <div className={classes.quantityRow}>
            <FormLabel className={classes.howMany}>How many?</FormLabel>
            <Remove className={classes.pointer} color='secondary' onClick={decreaseQuantity} />
              <TextField
                inputProps={{
                  min: 1,
                }}
                type='number'
                className={classes.quantityInput}
                hiddenLabel
                value={quantity}
                onChange={e => setQuantity(parseFloat(e.target.value))}
              />
            <Add className={classes.pointer} color='secondary' onClick={increaseQuantity} />
          </div>
          {item.Prices.length === 1 ?
          <div className={classes.row}>
            <FormLabel>Price</FormLabel>
            <div className={classes.singlePrice}>{item.Prices[0].valueLabelString}</div>
          </div>
          :
          <FormControl className={classes.formControl}>
            <FormLabel>Prices</FormLabel>
            <RadioGroup
              className={classes.row}
              value={selectedPriceIndex.toString()}
              onChange={(e, v) => setSelectedPriceIndex(parseFloat(v))}
            >
              {item.Prices.map((price, index) => (
                <FormControlLabel
                  key={index}
                  value={index.toString()}
                  control={<Radio />}
                  label={price.valueLabelString}
                />
              ))}
            </RadioGroup>
          </FormControl>}
          {
            item.Addons.length > 0 &&
            <FormControl className={classes.formControl}>
              <FormLabel>Addons</FormLabel>
              <FormGroup>
                {item.Addons.map((price, index) => (
                  <FormControlLabel
                    key={index}
                    control={
                      <Checkbox
                        checked={selectedAddons[index] || false}
                        onChange={e => setSelectedAddons({
                          ...selectedAddons,
                          [index]: e.target.checked
                        })}
                      />
                    }
                    label={`$${price.Value} ${price.Label}`}
                  />
                ))}
              </FormGroup>
            </FormControl>
          }
          {item.OptionGroups.map((group, index) => (
            <FormControl key={index} className={classes.formControl}>
              <FormLabel>Options {index + 1}</FormLabel>
              <RadioGroup
                className={classes.row}
                value={selectedGroupIndexes[index].toString()}
                onChange={(e, v) => {
                  const groups = [...selectedGroupIndexes];
                  groups[index] = parseFloat(v);
                  setSelectedGroupIndexes(groups)
                }}
              >
                {group.Options.map((option, index) => (
                  <FormControlLabel
                    key={index}
                    value={index.toString()}
                    control={<Radio />}
                    label={option.Name}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          ))}
          <FormControl className={classes.formControl}>
            <TextField
              multiline
              label='Special requests'
              rows='4'
              variant="outlined"
              value={specialRequests}
              onChange={e => setSpecialRequests(e.target.value)}
            />
          </FormControl>
          <Button
            color='primary'
            variant='contained'
            className={classes.button}
            onClick={onClickConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </Grow>
    </Modal>
  );
}

export default CartItemModal;
