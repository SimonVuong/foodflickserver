import React from 'react';
import { connect } from 'react-redux';
import { List, ListItem, Link } from '@material-ui/core';
import { CustomerCategory } from 'general/menu/models/CustomerItemModel';
import { RootState } from 'general/redux/rootReducer';
import { detailsId } from './MenuBrowserPage';

const CategoryNameListNavigator: React.FC<stateProps & {}> = ({ menu }) => (
  <List>
    <ListItem>
      <Link href={`#${detailsId}`} variant='subtitle1'>
        Details
      </Link>
    </ListItem>
    {menu.map((category, index) => (
      category.Items.length > 0 &&
      <ListItem key={index}>
        <Link href={`#${category.Name}`} variant='subtitle1'>
          {category.Name}
        </Link>
      </ListItem>
    ))}
  </List>
)
type stateProps = {
  menu: CustomerCategory[],
};
const mapStateToProps = (state: RootState) => ({
  menu: state.OrderingFlow.selectedRest!.Menu,
});

export default connect<stateProps, {}, {}, RootState>(mapStateToProps)(CategoryNameListNavigator);