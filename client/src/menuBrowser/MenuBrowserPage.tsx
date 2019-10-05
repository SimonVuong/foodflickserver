import React, { useState, useEffect } from 'react';
import { RouteComponentProps } from '@reach/router';
import { Theme, Container, Typography, Grid, GridList, GridListTile, GridListTileBar, useMediaQuery } from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/styles';
import { connect } from 'react-redux';
import { RootState } from 'general/redux/rootReducer';
import { CustomerRest } from 'general/rest/models/CustomerRestModel';
import { ThunkDispatch } from 'redux-thunk';
import { ToggleMobileDrawerAction, toggleMobileDrawerAction } from 'general/redux/ui/uiActions';
import MobileDrawer from './MobileDrawer';
import DesktopDrawer from './DesktopDrawer';
import AddCartItemModal from 'general/components/useCases/cartItemModal/AddCartItemModal';
import { SelectedRestStateReducer } from 'general/rest/redux/restReducer';
import { useGetRestByUrlQuery } from 'general/rest/restService';

const spacingPadding = 2;
const detailsId = 'Details';
type routeParams = {
  restUrl: string,
}
type props = {
  isMobileDrawerOpen: boolean,
  rest: SelectedRestStateReducer,
  toggleMobileDrawer: () => void,
}
const useStyles = makeStyles((theme: Theme) => ({
  container: {
    display: 'flex',
    paddingLeft: 0,
    paddingRight: 0,
    backgroundColor: theme.palette.background.default,
  },
  notFound: {
    textAlign: 'center',
  },
  content: {
    // necessary for safari, otherwise auto height is too short as it doesn't equal height of content in safari
    height: 'max-content',
  },
  categoryTitle: {
    // !importants necessary to override inline styles used by mui
    padding: `${theme.spacing(spacingPadding)}px 0px !important`,
  },
  section: {
    backgroundColor: theme.palette.common.white,
    padding: theme.spacing(1, 3),
    marginBottom: theme.spacing(2),
  },
  item: {
    // !importants necessary to override inline styles used by mui. 25vw chosen by inspection
    height: 'calc(25vw) !important',
    // max and min inspired by from instagram
    maxHeight: 300,
    minHeight: 159,
    cursor: 'pointer',
  },
  gridList: {
    width: '100%',
  },
}));

type anchorProps = {
  id: string,
  variant: 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'subtitle1'
  | 'subtitle2'
  | 'body1'
  | 'body2'
  | 'caption'
  | 'button'
  | 'overline'
}
const Anchor: React.FC<anchorProps> = ({ id, variant }) => {
  const theme: Theme = useTheme();
  const style: React.CSSProperties = {
    position: 'absolute',
    // 2 * for paddingBottom + top. spacePadding + 1 because we want to be slightly above hte category
    marginTop: `calc(0px - (${2 * theme.spacing(spacingPadding + 1)}px + ${theme.typography[variant].fontSize}))`
  };
  // eslint-disable-next-line
  return <a id={id} href={id} style={style}></a>;
}

type detailsProp = {
  rest: CustomerRest
};
const Details: React.FC<detailsProp> = ({ rest }) => {
  return (
    <Section>
      <Grid item>
        <Typography variant='h4' gutterBottom>
          <Anchor id={detailsId} variant='h6' />
          {rest.Name}
        </Typography>
      </Grid>
      <Grid item>
        <Typography variant='body1' paragraph>
          {rest.Description}
        </Typography>
      </Grid>
      <Grid container justify='space-between'>
        <Grid item md={2} xs={12}>
          <Typography variant='body1'>
            {rest.Phone}
          </Typography>
        </Grid>
        <Grid item md={5} xs={12}>
          <Typography variant='body1'>
            {rest.AddressString}
          </Typography>
        </Grid>
        <Grid item md={5} xs={12}>
          <Typography variant='body1'>
            {rest.TagsString}
          </Typography>
        </Grid>
      </Grid>
    </Section>
  )
}

const Section: React.FC = ({ children }) => {
  const classes = useStyles();
  return (
    <div className={classes.section}>
      {children}
    </div>
  )
}

const MenuBrowserPage: React.FC<props & RouteComponentProps<routeParams>> = ({ rest, isMobileDrawerOpen, toggleMobileDrawer, restUrl }) => {
  const classes = useStyles();
  const theme: Theme = useTheme();
  const [getRestByUrl, { loading, error, called, data }] = useGetRestByUrlQuery()
  const cols = useMediaQuery(theme.breakpoints.down('sm')) ? 2 : 3;
  const [open, setOpen] = useState(false);
  const [itemIndex, setItemIndex] = useState<number | null>(null);
  const [categoryIndex, setCategoryIndex] = useState<number | null>(null);
  const onClickItem = (itemIndex: number, categoryIndex: number) => {
    setCategoryIndex(categoryIndex);
    setItemIndex(itemIndex);
    setOpen(true);
  }
  const onClose = () => {
    setCategoryIndex(null);
    setItemIndex(null);
    setOpen(false);
  }
  useEffect(() => {
    if (!rest && restUrl) getRestByUrl(restUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rest, restUrl]);
  if (!loading && !error && called && !data) {
    return (
      <Container className={classes.container}>
        <Typography className={classes.notFound} variant='h4'>
          Restaurant not found. Please try another restaurant
        </Typography>
      </Container>
    );
  }
  if (!rest) return null;
  return (
    <Container className={classes.container}>
      {categoryIndex !== null && itemIndex !== null &&
      <AddCartItemModal
        categoryIndex={categoryIndex}
        customerItem={rest.Menu[categoryIndex!].Items[itemIndex!]}
        itemIndex={itemIndex}
        onClose={onClose}
        open={open}
      />
      }
      <MobileDrawer isMobileDrawerOpen={isMobileDrawerOpen} toggleMobileDrawer={toggleMobileDrawer} />
      <DesktopDrawer />
      <Grid container direction='column' className={classes.content}>
        <Details rest={rest} />
        {rest.Menu.map((category, categoryIndex) => (
          category.Items.length > 0 &&
          <Section>
            <GridList cellHeight='auto' cols={cols} key={categoryIndex} className={classes.gridList}>
              <GridListTile cols={cols} className={classes.categoryTitle}>
                <Typography variant='h5'>
                  <Anchor id={category.Name} variant='h6' />
                  {category.Name}
                </Typography>
                <Typography variant='body1'>
                  {category.Description}
                </Typography>
              </GridListTile>
              {category.Items.map((item, itemIndex) => (
                <GridListTile key={itemIndex} className={classes.item} onClick={() => onClickItem(itemIndex, categoryIndex)}>
                  {item.Flick ? <img src={item.Flick} alt={item.Name} /> : <Typography>{item.Description}</Typography>}
                  <GridListTileBar
                    title={item.Name}
                    subtitle={item.Prices[0].valueLabelString}
                  />
                </GridListTile>
              ))}
            </GridList>
          </Section>
        ))}
      </Grid>
    </Container>
  );
}

const mapStateToProps = (state: RootState) => ({
  rest: state.OrderingFlow.selectedRest,
  isMobileDrawerOpen: state.Ui.isMobileDrawerOpen,
});

const mapDispatchToProps = (dispatch: ThunkDispatch<RootState, null, ToggleMobileDrawerAction>) => ({
  toggleMobileDrawer: () => dispatch(toggleMobileDrawerAction())
});

export default connect(mapStateToProps, mapDispatchToProps)(MenuBrowserPage);

export {
  detailsId,
}