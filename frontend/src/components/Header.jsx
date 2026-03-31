import React from 'react';

const Header = ({ isAuthenticated, username, onSignIn, onSignOut }) => {
  return (
    <header className="app-header">
      <div className="header-content">
        <h1>Puppy Manager</h1>
        <nav>
          {isAuthenticated ? (
            <div className="user-info">
              <span>Hi, {username || 'User'}</span>
              <button className="btn btn-logout" onClick={onSignOut}>Log Out</button>
            </div>
          ) : (
            <button className="btn btn-login" onClick={onSignIn}>Sign In</button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
