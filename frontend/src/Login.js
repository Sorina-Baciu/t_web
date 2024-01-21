import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'; 

function Login({ onLogin }) {
    const [error, setError] = useState(undefined);
    const [message, setMessage] = useState(undefined);

    const [loginData, setLoginData] = useState({
        email: '',
        parola: '',
    });

    const [signupData, setSignupData] = useState({
        nume: '',
        prenume: '',
        email: '',
        parola: '',
        rol: '',
    });

    const reset = () => {
        setError(false);
        setMessage(undefined);
    }

    const handleLoginSubmit = async e => {
        e.preventDefault();
        reset();
        const response = await fetch('http://localhost:3001/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
        });
        const data = await response.json();
        if (response.ok) {
            if (data.message && data.token) {
                onLogin(data.rol);
                localStorage.setItem('token', data.token);
                localStorage.setItem('rol', data.rol);
                setError(false);
            }
        } else {
            setError(true);
        }
        setMessage(data.message);
    };

    const handleSignupSubmit = async e => {
        e.preventDefault();
        reset();
        const response = await fetch('http://localhost:3001/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(signupData)
        });
        const data = await response.json();
        if (response.ok) {
            if (data.message && data.newUser) {
                setError(false);
            }
        } else {
            setError(true);
        }
        setMessage(data.message);
    };

    const handleInputChange = (e, formType) => {
        const { name, value } = e.target;
        if (formType === 'login') {
            setLoginData({ ...loginData, [name]: value });
        } else if (formType === 'signup') {
            setSignupData({ ...signupData, [name]: value });
        }
    };

    return (
        <div className="container mt-5 p-5 card shadow-lg">
            <div className="row mb-5">
                <div className="col-md-6 p-5 card">
                    <div className="login-form">
                        <h2>Autentificare</h2>
                        <form onSubmit={handleLoginSubmit}>
                            <input type="email" required name="email" className="form-control mb-3" placeholder="Email" value={loginData.email} onChange={(e) => handleInputChange(e, 'login')} />
                            <input type="password" required name="parola" className="form-control mb-3" placeholder="Parola" value={loginData.parola} onChange={(e) => handleInputChange(e, 'login')} />
                            <button type="submit" className="btn btn-primary">Autentificare</button>
                        </form>
                    </div>
                </div>
                <div className="col-md-6 p-5 card">
                    <div className="signup-form">
                        <h2>Inregistrare</h2>
                        <form onSubmit={handleSignupSubmit}>
                            <select required name='rol' className="form-control mb-3" value={signupData.rol} onChange={(e) => handleInputChange(e, 'signup')}>
                                <option value="">Alege rol</option>
                                <option value="student">Student</option>
                                <option value="profesor">Profesor</option>
                            </select>
                            <input required type="text" name="nume" className="form-control mb-3" placeholder="Nume" value={signupData.nume} onChange={(e) => handleInputChange(e, 'signup')} />
                            <input required type="text" name="prenume" className="form-control mb-3" placeholder="Prenume" value={signupData.prenume} onChange={(e) => handleInputChange(e, 'signup')} />
                            <input required type="email" name="email" className="form-control mb-3" placeholder="Email" value={signupData.email} onChange={(e) => handleInputChange(e, 'signup')} />
                            <input required type="password" name="parola" className="form-control mb-3" placeholder="Parola" value={signupData.parola} onChange={(e) => handleInputChange(e, 'signup')} />
                            <button type="submit" className="btn btn-success">inregistrare</button>
                        </form>
                    </div>
                </div>
            </div>
            {message && <div className={"alert mt-2 text-boldd " + (error ? ' alert-danger ' : 'alert-success ')} role="alert">
                {message}
            </div>}
        </div>
    );
};

export default Login;