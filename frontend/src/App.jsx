import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@asgardeo/auth-react';
import Header from './components/Header';
import Body from './components/Body';
import Footer from './components/Footer';
import './App.css';

function App() {
  const { state, signIn, signOut, getAccessToken } = useAuthContext();
  const [token, setToken] = useState('');

  useEffect(() => {
    if (state.isAuthenticated) {
      getAccessToken()
        .then((t) => setToken(t))
        .catch((err) => console.error('Token error:', err));
    } else {
      setToken('');
    }
  }, [state.isAuthenticated]);

  return (
    <div className="app-wrapper">
      <Header
        isAuthenticated={state.isAuthenticated}
        username={state.username}
        onSignIn={() => signIn()}
        onSignOut={() => signOut()}
      />
      <Body accessToken={token} />
      <Footer />
    </div>
  );
}

export default App;
