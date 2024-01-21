import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PaginaProfesor from './PaginaProfesor';
import { useEffect, useState } from 'react';
import Login from './Login';
import { jwtDecode } from 'jwt-decode';
import Appbar from './Appbar';
import PaginaStudent from './PaginaStudent';

function App() {
  const [autentificat, setAutentificat] = useState(false);
  const [rol, setRol] = useState('');
  const [id, setId] = useState();
  const [email, setEmail] = useState('');

  // pentru a sti mereu daca si cine este autntificat
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decriptat = jwtDecode(token);
        if (decriptat.id) {
          setAutentificat(true);
          setRol(decriptat.rol);
          setEmail(decriptat.email);
          setId(decriptat.id);
        }
      } catch (e) {
        setAutentificat(false);
        localStorage.removeItem('token');
      }
    } else {
      setAutentificat(false);
    }
  }, [autentificat, rol]);

  const onLogin = rolul => {
    setAutentificat(true);
    setRol(rolul);
  };

  const onLogout = () => {
    localStorage.removeItem('token');
    setAutentificat(false);
    setRol('');
  };

  return (
    <>
      <Appbar autentificat={autentificat} onLogout={onLogout} email={email} />
      <Router>
        <Routes>
          <Route path="/" element={<PaginaPrincipala autentificat={autentificat} rol={rol} id={id} />} />
          <Route path="/login" element={autentificat ? <Navigate to="/" /> : <Login onLogin={onLogin} />} />
          <Route path="/neautorizat" element={<Neautorizat />} />
          <Route path="*" element={<PaginaNegasita />} />
        </Routes>
      </Router>
    </>
  );
}

// pagina care se afiseaza ambilor useri, in functie de rol
function PaginaPrincipala({ rol, autentificat, id }) {
  if (!autentificat) {
    return <Navigate to="/login" />
  }
  if (rol === 'student') {
    return <PaginaStudent autentificat={autentificat} id={id} />;
  }
  if (rol === 'profesor') {
    return <PaginaProfesor autentificat={autentificat} id={id} />;
  }
  return <></>
}

// in caz ca se incearca accesarea unei pagini inexistente
function PaginaNegasita() {
  return (
    <div style={{ padding: 20 }}>
      <h2>404: Pagina negasita</h2>
      <p>Ai tastat ceva gresit!</p>
    </div>
  );
}

// in caz ca se incearca accesarea unei pagini nepermise
function Neautorizat() {
  return (
    <div style={{ padding: 20 }}>
      <h2>403: Nu ai rolul necesar pentru a vizualiza!</h2>
      <p>Ai tastat ceva gresit!</p>
    </div>
  );
}
export default App;
