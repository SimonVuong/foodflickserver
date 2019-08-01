import React, { Component} from "react";

import  bg from '../static/img/background.jpg'
import logo from '../static/img/foodflick Final 2.png'

var divStyle = {
	'position': 'absolute',
	'height': '100%',
	'width': '100%',
  	backgroundImage: 'url(' + bg + ')',
  	'background-repeat': 'no-repeat',
  	'background-size': '1550px 850px'
};

var contact = {
	margin: 'auto',
  'margin-top': '18%',
  'text-align': 'center',
  width: '50%',
  border: '3px solid green',
  padding: '10px',
  backgroundColor: "white"
}

var title= {
	margin: 'auto',
	'margin-left': '498px',
    'position': 'absolute',
    'top': '112px'
}

var imgstyle = {
	    'width': '50%'
}

class App extends Component{
  render(){
    return(
      <div className="App" style={divStyle}>
      	<div style={title}>
      		<img src={logo} style={imgstyle}/>
      	</div>
      	<div style={contact}>
	         <h2>Simon Vuong</h2>
	         <h3>Email: simonlvuong@gmail.com</h3>
         </div>
      </div>
    );
  }
}

export default App;