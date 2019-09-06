import React from 'react';
import { CustomerItem } from 'general/menu/models/CustomerItemModel';
import { connect } from 'react-redux';
import { updateCartItemAction } from 'general/order/redux/cartActions';
import { ThunkDispatch } from 'redux-thunk';
import { RootState, RootActions } from 'general/redux/rootReducer';
import { CartItem } from 'general/order/CartItemModel';
import { Price, Option } from 'general/menu/models/BaseItemModel';
import CartItemModal from './CartItemModal';

type props = {
  customerItem: CustomerItem,
  cartItem: CartItem,
  onClose: () => void,
  open: boolean,
  targetIndex: number,
  updateCartItem: (
    selectedPrice: Price,
    selectedOptions: Option[],
    quantity: number,
    specialRequests: string | undefined,
    targetIndex: number,
  ) => void
}

const UpdateCartItemModal: React.FC<props> = ({ open, onClose, customerItem, updateCartItem, targetIndex, cartItem }) => {
  const defaultPriceIndex = customerItem.Prices.findIndex(price => price.isEqual(cartItem.SelectedPrice));
  const defaultSelectedGroupIndexes = customerItem.OptionGroups.map((group, groupIndex) => 
    group.Options.findIndex(option => option.isEqual(cartItem.SelectedOptions[groupIndex])))
  const onConfirm = (
    selectedPrice: Price,
    selectedOptions: Option[],
    quantity: number,
    specialRequests?: string
  ) => updateCartItem(
    selectedPrice,
    selectedOptions,
    quantity,
    specialRequests,
    targetIndex,
  );
  return (
    <CartItemModal
      confirmText='Update cart item'
      item={customerItem}
      defaultSelectedPriceIndex={defaultPriceIndex}
      defaultQuantity={cartItem.Quantity}
      defaultSelectedOptionIndexes={defaultSelectedGroupIndexes}
      defaultSpecialRequests={cartItem.SpecialRequests}
      onConfirm={onConfirm}
      onClose={onClose}
      open={open}
    />
  );
}

const mapDispatchToProps = (dispatch: ThunkDispatch<RootState, null, RootActions>) => ({
  updateCartItem: (
    selectedPrice: Price,
    selectedOptions: Option[],
    quantity: number,
    specialRequests: string | undefined,
    targetIndex: number,
  ) => dispatch(updateCartItemAction(
    selectedPrice,
    selectedOptions,
    quantity,
    specialRequests,
    targetIndex,
  ))
});

export default connect(null, mapDispatchToProps)(UpdateCartItemModal);
