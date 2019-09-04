// stolen from https://codesandbox.io/s/reactstripeelements-textfield-integration-ejo6s?from-embed

import React from 'react';
import TextField from '@material-ui/core/TextField'

const StripeInput = props => {
  const { component: Component, inputRef, ...other } = props;
  const elementRef = React.useRef();

  React.useImperativeHandle(inputRef, () => ({
    focus: () => elementRef.current.focus
  }));
  const {
    // these are all the unsupported props by stripe
    // aria-describedby,
    // aria-invalid,
    // autoComplete,
    // autoFocus,
    // defaultValue,
    // name,
    // onKeyDown,
    // onKeyUp,
    // readOnly,
    // required,
    // rows,
    // type,
    className,
    disabled,
    id,
    onBlur,
    onChange,
    onFocus,
    placeholder,
    value,
  } = other;
  const supportedProps = {
    className,
    disabled,
    id,
    onBlur,
    onChange,
    onFocus,
    placeholder,
    value,
  };
  return <Component onReady={element => (elementRef.current = element)} {...supportedProps} />

}

const TextFieldWithStripeElement = props => {
  const [errorMessage, setErrorMessage] = React.useState(null);
  const handleElementChange = ({ complete, error }) => {
    if (error) {
      setErrorMessage(error.message);
    } else {
      setErrorMessage(null);
    }
  }
  const hasError = errorMessage !== null;
  const {
    StripeElement,
    label,
    ...otherProps
  } = props;
  return (
    <TextField
      fullWidth
      margin='normal'
      label={label}
      error={hasError}
      helperText={hasError ? errorMessage || 'Invalid' : ''}
      onChange={handleElementChange}
      InputLabelProps={{
        shrink: true
      }}
      InputProps={{
        inputProps: {
          component: StripeElement
        },
        inputComponent: StripeInput
      }}
      {...otherProps}
    />
  );
}

export default TextFieldWithStripeElement