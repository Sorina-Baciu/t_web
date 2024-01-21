import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';

const PaginaColaborari = ({ autentificat, id }) => {
    const [error, setError] = useState(undefined);
    const [message, setMessage] = useState(undefined);
    const [profesori, setProfesori] = useState([]);
    const [profesor, setProfesor] = useState(undefined);
    const [fisier, setFisier] = useState();
    const [colab, setColab] = useState();
    const [refresh, setRefresh] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!autentificat) navigate("/login");
        async function preluareProfesoriCuSesiuniActive() {
            try {
                // prima data verificam daca studentul nu are colaborari acceptate
                const resStud = await fetch('http://localhost:3001/sesiuni/student-eligibil/',
                    { headers: { 'Authorization': localStorage.getItem('token') } });

                const dataStud = await resStud.json()

                // daca nu are, preluam profesorii catre care poate trimite cerere
                if (resStud.ok) {
                    const res = await fetch('http://localhost:3001/sesiuni/profesori/',
                        { headers: { 'Authorization': localStorage.getItem('token') } });
                    const data = await res.json()
                    if (res.ok) {
                        setProfesori(data)
                    }
                } else {
                    setError(false);
                    setProfesor(dataStud.prof);
                    setColab(dataStud.colab);
                }
            } catch (e) {
                setError(true);
                setMessage(e.message);
            }
        };
        preluareProfesoriCuSesiuniActive();
    }, [refresh]);

    // pentru a disparea erorile si mesajele anterioare
    const reset = () => {
        setError(false);
        setMessage(undefined);
    }

    // trimiterea cererii
    const trimiteCerere = async profesorId => {
        reset();
        const response = await fetch('http://localhost:3001/colaborari', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('token')
            },
            body: JSON.stringify({ profesorId })
        });
        const data = await response.json();
        if (response.ok) {
            if (data.colaborare) {
                setError(false);
                setMessage("Colaborare trimisa!");
            }
        } else {
            setError(true);
            setMessage(data.message);
        }
        setRefresh(!refresh);
    };

    // daca nu are colaborare cu profesorul
    const poateTrimite = profesor => {
        if (profesor.student.length > 0) {
            const existaCerereCatreAcestProf = profesor.student.find(p => p.id == id);
            return !existaCerereCatreAcestProf;
        }
        return true;
    }

    // incarcarea unui fisier pdf
    const incarcaCerere = event => {
        const fisierIncarcat = event.target.files[0];
        if (fisierIncarcat.type === 'application/pdf') {
            const fileReader = new FileReader();
            let base64;
            fileReader.onload = (e) => {
                base64 = e.target.result;
                setFisier(base64);
            };
            fileReader.readAsDataURL(fisierIncarcat);
        } else {
            setError(true);
            setMessage('Incarca doar fisier PDF!');
        }
    }

    // trimiterea fisierului
    const trimiteFisierCerere = async () => {
        reset();
        if (!fisier) {
            setError(true);
            setMessage('Incarca un fisier!');
            return;
        }
        const response = await fetch('http://localhost:3001/colaborari/' + colab.id, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('token')
            },
            body: JSON.stringify({ fisier, status: 2 })
        });
        const data = await response.json();
        if (response.ok) {
            setError(false);
            setMessage("Cerere trimisa!");
        } else {
            setError(true);
            setMessage(data.message);
        }
        setRefresh(true);
    }

    // descarcarea cererii daca profesorul a trimis-o
    const descarcaCerere = () => {
        const downloadLink = document.createElement('a');
        const fileName = 'cerere.pdf';
        downloadLink.href = colab.fisier;
        downloadLink.download = fileName;
        downloadLink.click();
    };

    return (
        <div className="container mt-5 card shadow-lg p-5">
            <h2>Lista profesorilor cu sesiuni active</h2>
            <ul className="list-group">
                {profesori.map((profesor) => (
                    <li key={profesor.id} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <h4>{profesor.nume} {profesor.prenume}</h4>
                            {profesor.Sesiuni.map(sesiune => (
                                <p key={sesiune.id}>Sesiunea {sesiune.dataInceput} - {sesiune.dataSfarsit}, locuri: {sesiune.SesiuneProfesori.capacitateStudenti}</p>
                            ))}
                        </div>
                        {poateTrimite(profesor) ? <button
                            className="btn btn-primary"
                            onClick={() => trimiteCerere(profesor.id)}
                        >
                            Trimite solicitare
                        </button> : <p>Ai trimis deja o cerere.</p>}
                    </li>
                ))}
            </ul>
            {profesor && <div className="alert m-2 " role="alert">
                {"Esti acceptat de dl/dna prof. " + profesor.nume + ' ' + profesor.prenume + '.'}
            </div>}
            {message && <div className={"alert m-2 " + (error ? ' alert-danger ' : 'alert-success ')} role="alert">
                {message}
            </div>}
            {profesor && (!colab.fisier || colab.status === 3) && <div className="container mt-5 card shadow-lg p-5">
                <div className="card-header">
                    Incarca cererea
                </div>
                <div className="card-body">
                    <form>
                        <div className="mb-3">
                            <input accept=".pdf" required type="file" min={new Date()} className="form-control" id="dataInceput" name="dataInceput" onChange={incarcaCerere} />
                        </div>
                        <button type="button" disabled={!fisier} className="btn btn-primary" onClick={trimiteFisierCerere}>Trimite</button>
                    </form>
                </div>
            </div>}
            {profesor && colab.fisier && colab.status === 2 && <button className='btn btn-secondary' onClick={descarcaCerere}>Descarca pdf</button>
            }
             {profesor && colab.fisier && colab.status === 3 && <p className='text-danger'>Cererea ta a fost refuzata cu motivul: {colab.motivRefuz}</p>
            }
        </div>
    );
};

export default PaginaColaborari;