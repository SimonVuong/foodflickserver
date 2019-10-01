import React from 'react';
import { CustomerItem } from 'general/menu/models/CustomerItemModel';
import { connect } from 'react-redux';
import { updateCartItemAction } from 'general/order/redux/cartActions';
import { ThunkDispatch } from 'redux-thunk';
import { RootState, RootActions } from 'general/redux/rootReducer';
import { CartItem } from 'general/order/CartItemModel';
import { Price, Option, Addon } from 'general/menu/models/BaseItemModel';
import CartItemModal from './CartItemModal';

type selectedAddons = {
  [key: string]: boolean
};

type props = {
  customerItem: CustomerItem,
  cartItem: CartItem,
  onClose: () => void,
  open: boolean,
  targetIndex: number,
  updateCartItem: (
    selectedPrice: Price,
    selectedOptions: Option[],
    selectedAddons: Addon[],
    quantity: number,
    specialRequests: string | undefined,
    targetIndex: number,
  ) => void
}

const UpdateCartItemModal: React.FC<props> = ({ open, onClose, customerItem, updateCartItem, targetIndex, cartItem }) => {
  const defaultPriceIndex = customerItem.Prices.findIndex(price => price.isEqual(cartItem.SelectedPrice));
  const defaultSelectedGroupIndexes = customerItem.OptionGroups.map((group, groupIndex) =>
    group.Options.findIndex(option => option.isEqual(cartItem.SelectedOptions[groupIndex])))
  const defaultSelectedAddons = customerItem.Addons.reduce((map, addon, addonIndex) => {
    map[addonIndex] = !!cartItem.SelectedAddons.find(cartItemAddon => cartItemAddon.isEqual(addon));
    return map;
  }, {} as selectedAddons)
  const onConfirm = (
    selectedPrice: Price,
    selectedOptions: Option[],
    selectedAddons: Addon[],
    quantity: number,
    specialRequests?: string
  ) => updateCartItem(
    selectedPrice,
    selectedOptions,
    selectedAddons,
    quantity,
    specialRequests,
    targetIndex,
  );
  return (
    <CartItemModal
      confirmText='Update cart item'
      item={customerItem}
      defaultAddons={defaultSelectedAddons}
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
    selectedAddons: Addon[],
    quantity: number,
    specialRequests: string | undefined,
    targetIndex: number,
  ) => dispatch(updateCartItemAction(
    selectedPrice,
    selectedOptions,
    selectedAddons,
    quantity,
    specialRequests,
    targetIndex,
  ))
});

export default connect(null, mapDispatchToProps)(UpdateCartItemModal);
