import React, { useState } from 'react';
import { RouteComponentProps, Link as RouterLink } from '@reach/router';
import { TextField, Link, InputAdornment } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { routes } from 'general/routes/routes';
import Search from '@material-ui/icons/Search';
import SearchModal from 'general/components/lib/SearchModal';
const background = '/assets/global/background.jpg';

const useStyles = makeStyles(theme => ({
  link: {
    [theme.breakpoints.up('sm')]: {
      backgroundColor: theme.palette.common.white,
      border: `1px solid ${theme.palette.secondary.main}`,
      textDecoration: 'none !important'
    },
    padding: '5px 10px',
  },
  input: {
    width: '75%',
  },
  pointer: {
    cursor: 'pointer',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  background: {
    width: '100vw',
    paddingTop: '15vh',
    marginTop: -theme.mixins.navbar.marginBottom,
    backgroundPosition: 'bottom',
    backgroundImage: `url(${background})`,
    backgroundSize: 'cover',
  }
}));

const HomePage: React.FC<RouteComponentProps> = () => {
  const [open, setOpen] = useState(false);
  const classes = useStyles();
  return (
    <div className={classes.background}>
      <SearchModal open={open} onClose={() => setOpen(false)} />
      <div className={classes.content}>
        <TextField
          hiddenLabel
          margin='normal'
          placeholder='What are you hungry for?'
          variant='filled'
          onClick={() => setOpen(true)}
          className={classes.input}
          inputProps={{ className: classes.pointer }} // pointer cusor over input
          InputProps={{
            endAdornment: (
              <InputAdornment position='end' variant='standard'>
                <Search />
              </InputAdornment>
            ),
            classes: { root: classes.pointer } // pointer cusor over search icon
          }}
        />
        <Link
          component={RouterLink}
          to={routes.about.getLink()}
          className={classes.link}
          color='secondary'
        >
          About foodflick
        </Link>
      </div>
    </div>
  )
}

export default HomePage