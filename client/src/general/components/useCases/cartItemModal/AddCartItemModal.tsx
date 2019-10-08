import React from 'react';
import { connect } from 'react-redux';
import { RootActions, RootState } from 'general/redux/rootReducer';
import { ThunkDispatch } from 'redux-thunk';
import { CustomerItem } from 'general/menu/models/CustomerItemModel';
import { Price, Option, Addon } from 'general/menu/models/BaseItemModel';
import { addCartItemAction } from 'general/order/redux/cartActions';
import CartItemModal from './CartItemModal';

type props = {
  addToCart: (
    categoryIndex: number,
    itemIndex: number,
    selectedPrice: Price,
    selectedOptions: Option[],
    selectedAddons: Addon[],
    quantity: number,
    specialRequests?: string
  ) => void,
  categoryIndex: number,
  customerItem: CustomerItem,
  itemIndex: number,
  onClose: () => void,
  open: boolean,
}

const AddCartItemModal: React.FC<props> = ({
  addToCart,
  open,
  onClose,
  categoryIndex,
  customerItem,
  itemIndex,
}) => {
  const onConfirm = (
    selectedPrice: Price,
    selectedOptions: Option[],
    selectedAddons: Addon[],
    quantity: number,
    specialRequests: string | undefined
  ) => addToCart(
    categoryIndex,
    itemIndex,
    selectedPrice,
    selectedOptions,
    selectedAddons,
    quantity,
    specialRequests
  )
  
  return (
    <CartItemModal
      confirmText='Add to cart'
      item={customerItem}
      onConfirm={onConfirm}
      onClose={onClose}
      open={open}
    />
  );
}

const mapDispatchToProps = (dispatch: ThunkDispatch<RootState, null, RootActions>) => ({
  addToCart: (
    categoryIndex: number,
    itemIndex: number,
    selectedPrice: Price,
    selectedOptions: Option[],
    selectedAddons: Addon[],
    quantity: number,
    specialRequests?: string
  ) => dispatch(addCartItemAction(
    categoryIndex,
    itemIndex,
    selectedPrice,
    selectedOptions,
    selectedAddons,
    quantity,
    specialRequests,
  ))
});

export default connect(null, mapDispatchToProps)(AddCartItemModal);
