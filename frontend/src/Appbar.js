import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const Appbar = ({ onLogout, autentificat, email }) => {
    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
            <div className="container">
                <a className="navbar-brand" href="/">Hai la dizertatie! </a>
                <a className="navbar-brand">{email}</a>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto">
                        {autentificat ? <li className="nav-item">
                            <a className="nav-link" onClick={onLogout} href='#'>Iesi din cont</a>
                        </li> : <li className="nav-item">
                            <a className="nav-link" href="/login">Autentificare</a>
                        </li>}
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Appbar;