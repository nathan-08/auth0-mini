import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import axios from 'axios';

class App extends Component {
  constructor() {
    super();
    this.state = {
      user: null,
      secureDataResponse: null,
      redirectUri: encodeURIComponent(window.location.origin + '/auth/callback'),
      code: null,
      accessToken: null,
      userData: null
    };
    this.logout = this.logout.bind(this);
    this.fetchSecureData = this.fetchSecureData.bind(this);
  }

  componentDidMount() {
    // get user data
    axios
      .get("/api/user-data")
      .then(response => {
        this.setState({
          user: response.data.user || null
        })
      })
    // get query out of url
    const url = window.location.href;
    const code = url.match(/code=(.*)/)

    this.setState({
      code: code ? code[1] : null
    })
  }

  login = () => {
    window.location = `https://${process.env.REACT_APP_AUTH0_DOMAIN}/authorize?client_id=${process.env.REACT_APP_AUTH0_CLIENT_ID}&scope=openid%20profile%20email&redirect_uri=${this.state.redirectUri}&response_type=code`
  }

  logout() {
    axios.post('/api/logout').then(() => {
      this.setState({ user: null });
    });
  }

  stepTwo = () => {
    // this should be run when auth0 has given us a code
    // this will hit an endpoint on the backend that will exchange that code for an access token 
    axios
      .post('/api/step2', {code: this.state.code})
      .then(res=>{
        this.setState({
          accessToken: res.data.access_token
        })
      })

  }

  stepThree = () => {
    // step three, here we want to tell the server to exchange the access_token for user data
    axios
      .post('/api/step3', {access_token: this.state.accessToken})
      .then(result=>{
        console.log(result.data)
        this.setState({
          userData: result.data
        })
      })
      .catch(err=> console.log('-- err step 3 --', err))
  }

  stepFour = () => {
    // here we will send the user data back, and have it stored on session
    axios
      .post('/api/step4', this.state.userData)
      .then(result=>console.log(result))
      .catch(err=>console.log('-- err step 4 --', err))
  }

  getMessage(error) {
    return error.response
      ? error.response.data
        ? error.response.data.message
        : JSON.stringify(error.response.data, null, 2)
      : error.message;
  }

  fetchSecureData() {
    axios.get('/api/secure-data').then(response => {
      this.setState({ secureDataResponse: JSON.stringify(response.data, null, 2) });
    }).catch(error => {
      this.setState({ secureDataResponse: this.getMessage(error) });
    })
  }

  render() {
    const { user, secureDataResponse } = this.state;
    const userData = JSON.stringify(user, null, 2);

    return (
      <div className="App">
      <h2 style={{paddingLeft: "2.6rem", background: "#333", color: "#fff", marginTop: 0, paddingTop: "2rem", paddingBottom: "1rem"}} >auth0 mini project</h2>
        <header style={{display:"none"}} className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <div className="App-intro">
          <div style={{display:"none"}} className="section">
            <button onClick={this.login}>Log in</button>
            {' '}
            <button onClick={this.logout}>Log out</button>
          </div>
          <div className="section">
            <p>This front end app will walk you through the process of connecting to Auth0
            <br/>
            <small>Remember to restart `npm start` whenever you change the package.json file</small>
            </p>
            <h2>steps: </h2>
            <ol>
                <li> 
                  redirect client to auth0 
                  <br/><small>the login function will set <code>window.location</code> to a customized url</small>
                  <div className="section">
                  <small>Using a template literal, set <code>window.location</code></small>
                  <code><pre>
                    window.location = `https://${"{"}<span className="blue">process.env.REACT_APP_AUTH0_DOMAIN</span>{"}"}/authorize?client_id=${"{"}<span className="blue">process.env.REACT_APP_AUTH0_CLIENT_ID</span>{"}"}&scope=openid%20profile%20email&redirect_uri=${"{"}<span className="blue">this.state.redirectUri</span>{"}"}&response_type=code`
                  </pre></code>
                    <table>
                      <tbody>
                      <tr>
                        <th>Current Values:</th>
                      </tr>
                      <tr>
                        <td><code>process.env.REACT_APP_AUTH0_DOMAIN</code></td>
                        <td><code className="highlight">{process.env.REACT_APP_AUTH0_DOMAIN}</code></td>
                      </tr>  
                      <tr>
                        <td><code>process.env.REACT_APP_AUTH0_CLIENT_ID</code></td>
                        <td><code className="highlight">{process.env.REACT_APP_AUTH0_CLIENT_ID}</code></td>
                      </tr>  
                      <tr>
                        <td><code>this.state.redirectUri</code></td>
                        <td><code className="highlight">{this.state.redirectUri}</code></td>
                      </tr>
                      <tr>
                        <td><code>complete URL</code></td>
                        <td><code>
                          https://{process.env.REACT_APP_AUTH0_DOMAIN}/authorize?client_id={process.env.REACT_APP_AUTH0_CLIENT_ID}&scope=openid%20profile%20email&redirect_uri={this.state.redirectUri}&response_type=code
                        </code></td>
                      </tr>  
                      </tbody>
                    </table>
                    <br/>
                    <span>are all fields defined? </span><button onClick={this.login}>send the request to auth0 (this will run the login function)</button>
                    </div>
                </li>
                <li>
                  auth0 sends a code in url query to our callback url (server)

                <div className="section">
                  <div><pre>code: {this.state.code || 'null'}</pre></div>
                  <span>is code defined? </span><button onClick={this.stepTwo}>exchange code for access token</button>
                </div>

                </li>
                <li>
                server sends POST request for AccessToken, using the given code
                <div className="section">
                  <div><pre>access_token: {this.state.accessToken || 'null'}</pre></div>
                  <span>is access_token defined? </span><button onClick={this.stepThree}>exchange access_token for user info</button>
                </div>


                </li>
                <li>request user info from auth0 using the access_token</li>
                  <div className="section">
                    <div><pre>user data: {JSON.stringify(this.state.userData) || 'null'}</pre></div>
                    <span>is user data defined? </span><button onClick={this.stepFour}>store user data on session</button>
                  </div>
                <li>store user data on session</li>
              </ol>
          </div>
          
          <div className="section">
            <button onClick={this.fetchSecureData}>Fetch secure data</button>
            <div><pre>{secureDataResponse}</pre></div>
            <button onClick={this.logout}>logout</button>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
