import React, { useState, useEffect, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';
import Slide from '@material-ui/core/Slide';
import Close from '@material-ui/icons/Close';
import Search from '@material-ui/icons/Search';
import { TextField, InputAdornment, List, ListItem, ListItemText } from '@material-ui/core';
import { RestService } from 'general/rest/restService';
import { debounce, throttle } from 'lodash';
import { CustomerRest } from 'general/rest/models/CustomerRestModel';
import { selectOrderingRestAction } from 'general/rest/redux/restActions';
import { connect } from 'react-redux';
import { RootActions, RootState } from 'general/redux/rootReducer';
import { ThunkDispatch } from 'redux-thunk';
import { navigate } from '@reach/router';
import { routes } from 'general/routes/routes';

const useStyles = makeStyles(theme => ({
  pointer: {
    cursor: 'pointer',
  },
  paper: {
    // arbituarily large height such that it convers the entire height of small phones while leaving bottom space for
    // longer screens. inspired by Tripadvisor search
    height: 600,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
}));

type props ={
  open: boolean,
  onClose: () => void,
  selectRest: (rest: CustomerRest) => void,
}

const getDelayedFn = (fn: (query: string) => void) => {
  const throttledFn = throttle(fn, 500);
  const debouncedFn = debounce(fn, 500);
  return (query: string) => {
    if (query.length < 3) {
      throttledFn(query);
    } else {
      debouncedFn(query);
    }
  }
}

const SearchModal: React.FC<props> = ({ open, onClose, selectRest }) => {
  const classes = useStyles();
  const [rests, setRests] = useState<CustomerRest[]>([]);
  const [displayQuery, setDisplayQuery] = useState('');
  // https://github.com/facebook/react/issues/14010
  // useRef so we can get the latestDisplay query in the fetch promise fn
  const currDisplayQuery = useRef(displayQuery);
  currDisplayQuery.current = displayQuery;

  const updateSuggestions = (fetchQuery: string) => {
    if (!fetchQuery) return;
    RestService.getRestSearchSuggestions(fetchQuery)
      .then(restSuggestions => {
        // depending on network speed, it is possible to receive suggestions out of the order they were made.
        // ex: suggestions for 'foo' may come after 'food' so we only set state when suggestions correspond to the
        // most recent query.
        if (fetchQuery === currDisplayQuery.current) setRests(restSuggestions);
      })
  }

  //https://stackoverflow.com/questions/54666401/how-to-use-throttle-or-debounce-with-react-hook
  // useRef because we want a store this delayedFetch between renders, otherwise we always redefine the delayedFetch
  // which means useEffect calls a different function on each run which means we never actually delay anything.
  const delayedFetchSuggestions = useRef(getDelayedFn(updateSuggestions));
  useEffect(() => delayedFetchSuggestions.current(displayQuery), [displayQuery]);
  return (
    <Modal
      open={open}
      onClose={onClose}
      BackdropProps={{ invisible: true }}
    >
      <Slide in={open} direction='down'>
        <div className={classes.paper}>
          <Close onClick={onClose} className={classes.pointer}/>
          <TextField
            hiddenLabel
            fullWidth
            value={displayQuery}
            onChange={e => setDisplayQuery(e.target.value)}
            margin='normal'
            placeholder='Restaurant name?'
            InputProps={{
              endAdornment: (
                <InputAdornment position='end'>
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <List>
            {displayQuery && rests.map(rest => (
              <ListItem key={rest._Id} className={classes.pointer} onClick={() => {
                selectRest(rest);
                navigate(routes.menuBrowser.getLink(rest.Url))}
              }>
                <ListItemText primary={rest.Name} />
              </ListItem>
            ))}
          </List>
        </div>
      </Slide>
    </Modal>
  );
}

const mapDispatchToProps = (dispatch: ThunkDispatch<RootState, null, RootActions>) => ({
  selectRest: (rest: CustomerRest) => dispatch(selectOrderingRestAction(rest))
})

export default connect(null, mapDispatchToProps)(SearchModal);
