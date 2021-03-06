import React from 'react';
import { connect } from 'react-redux';
import { List, ListItem, Link, Typography } from '@material-ui/core';
import { CustomerCategory } from 'general/menu/models/CustomerItemModel';
import { RootState } from 'general/redux/rootReducer';
import { detailsId } from './MenuBrowserPage';

type props = {
  onClickCategory?: () => void
}

const CategoryNameListNavigator: React.FC<stateProps & props> = ({ menu, onClickCategory }) => (
  <List>
    <ListItem>
      <Typography variant='h6'>
        Menu
      </Typography>
    </ListItem>
    <ListItem>
      <Link
        onClick={onClickCategory}
        href={`#${detailsId}`}
        variant='subtitle1'
        color='textPrimary'
      >
        Back to top
      </Link>
    </ListItem>
    {menu.map((category, index) => (
      category.Items.length > 0 &&
      <ListItem key={index}>
        <Link
          onClick={onClickCategory}
          href={`#${category.Name}`}
          variant='subtitle1'
          color='textPrimary'
        >
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