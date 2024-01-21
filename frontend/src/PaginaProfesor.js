import React, { useEffect, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';

const PaginaSesiuni = ({ autentificat, id }) => {
    const [error, setError] = useState(undefined);
    const [message, setMessage] = useState(undefined);
    const [studenti, setStudenti] = useState([]);
    const [sesiuni, setSesiuni] = useState([]);
    const motivRefuz = useRef();
    const [fisier, setFisier] = useState();
    const [capacitateStudenti, setCap] = useState();
    const [arata, setArata] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!autentificat) navigate("/login");
        // preluarea tuturor studentilor care sunt asociati acestui profesor printr-o colaborare
        async function preluareStudentiCuCereri() {
            const res = await fetch('http://localhost:3001/sesiuni/studenti/',
                { headers: { 'Authorization': localStorage.getItem('token') } });
            const data = await res.json()
            if (res.ok) {
                setStudenti(data);
            }
        };
        async function preluareSesiuni() {
            const res = await fetch('http://localhost:3001/sesiuni/all');
            const data = await res.json()
            if (res.ok) {
                console.log(data)
                setSesiuni(data);
            }
        };
        preluareStudentiCuCereri();
        preluareSesiuni();
    }, [error, message]);


    // resetare mesaje si erori
    const reset = () => {
        setError(false);
        setMessage(undefined);
    }

    // datele pentru adaugarea unei sesiuni
    const [formData, setFormData] = useState({
        dataInceput: '',
        dataSfarsit: '',
        capacitateStudenti: '',
    });

    // setarea valorii noi pentru campul corespunzator, in functie de evenimentul declansator
    const handleInputChange = (e) => {
        reset();
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // validare existenta date din formular dar si a perioadei de incepere/terminare a sesiunii
    const validareDate = () => {
        if (!formData.dataInceput || !formData.dataSfarsit || !formData.capacitateStudenti) {
            setError(true);
            setMessage('Te rog completeaza toate campurile.');
            return false;
        }

        // Validare pentru datele introduse 
        const dataInceput = new Date(formData.dataInceput);
        const dataSfarsit = new Date(formData.dataSfarsit);
        const currentDate = new Date();

        if (dataInceput < currentDate || dataSfarsit < currentDate) {
            setError(true);
            setMessage('Te rog alege o data viitoare!');
            return false;
        }

        if (dataInceput >= dataSfarsit) {
            setError(true);
            setMessage('Data de sfarsit trebuie sa fie dupa data de inceput!');
            return false;
        }

        if (formData.capacitateStudenti < 1 || formData.capacitateStudenti > 15) {
            setError(true);
            setMessage('Capacitatea trebuie sa fie intre 1 si 15!');
            return false;
        }
        setError(false);
        setMessage('Sesiune adaugata!');
        return true;
    }

    // trimitere sesiune la server
    const salvareSesiune = async () => {
        reset();
        validareDate();
        const response = await fetch('http://localhost:3001/sesiuni', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('token')
            },
            body: JSON.stringify(formData)
        });
        const data = await response.json();
        if (response.ok) {
            if (data.sesiuneInscriere) {
                setError(false);
                setMessage("Sesiune adaugata!");
            }
        } else {
            setError(true);
            setMessage(data.message);
        }
    };

    // trimiterea raspunsului catre student
    const trimiteRaspuns = async (status, idCerere, trimiteFisier) => {
        reset();
        if (trimiteFisier) {
            if (!fisier) {
                setError(true);
                setMessage('Incarca un fisier!');
                return;
            }
        }
        if (status === 0) {
            if (!motivRefuz.current.value) {
                setError(true);
                setMessage("Adaugati un motiv de refuz!")
                return;
            }
        }
        const response = await fetch('http://localhost:3001/colaborari/' + idCerere, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('token')
            },
            body: JSON.stringify({ status, motivRefuz: trimiteFisier || status === 1 ? null : motivRefuz.current.value, fisier })
        });
        const data = await response.json();
        if (response.ok) {
            setError(false);
            setMessage("Succes!");
        } else {
            setError(true);
            setMessage(data.message);
        }
    }

    const eAcceptat = student => {
        if (student.Colaborare) {
            return student.Colaborare.status
        }
    }

    const areCerere = student => {
        return student.Colaborare.fisier != undefined
    }

    const descarcaCerere = student => {
        const downloadLink = document.createElement('a');
        const fileName = 'cerere.pdf';
        downloadLink.href = student.Colaborare.fisier;
        downloadLink.download = fileName;
        downloadLink.click();
    };

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

    const faceParteDinSesiune = idSesiune => {
        return sesiuni.find(s => s.id == idSesiune && s.Profesori.find(p => p.id == id))
    }

    const participaLaSesiune = async idSesiune => {
        reset();
        if (!capacitateStudenti) {
            setError(true);
            setMessage("Dati capacitate.")
            return;
        }
        const response = await fetch('http://localhost:3001/sesiuni/asociere/' + idSesiune, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('token')
            },
            body: JSON.stringify({ capacitateStudenti })
        });
        const data = await response.json();
        if (response.ok) {
            setError(false);
            setMessage("Succes!");
        } else {
            setError(true);
            setMessage(data.message);
        }
    }

    return (
        <div className="container mt-5">
            <div className="row justify-content-center mb-4">
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-header">
                            Adauga sesiune de inscriere
                        </div>
                        <div className="card-body">
                            <form>
                                <div className="mb-3">
                                    <label htmlFor="dataInceput" className="form-label">Data de inceput:</label>
                                    <input required type="date" min={new Date()} className="form-control" id="dataInceput" name="dataInceput" value={formData.dataInceput} onChange={handleInputChange} />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="dataSfarsit" className="form-label">Data de sfarsit:</label>
                                    <input required type="date" className="form-control" id="dataSfarsit" min={new Date()} name="dataSfarsit" value={formData.dataSfarsit} onChange={handleInputChange} />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="capacitateStudenti" className="form-label">Capacitate de studenti (1-15):</label>
                                    <input required type="number" className="form-control" id="capacitateStudenti" name="capacitateStudenti" min="1" max="15" value={formData.capacitateStudenti} onChange={handleInputChange} />
                                </div>
                                <button type="button" className="btn btn-primary" onClick={salvareSesiune}>Salvare</button>
                            </form>
                        </div>
                        <button className='btn btn-info' onClick={()=>setArata(!arata)}>{arata? 'Ascunde' : 'Arata sesiuni'}</button>
                        {arata && sesiuni && sesiuni.map(s => (
                            <div className='card p-2' key={s.id}>{s.dataInceput} - {s.dataSfarsit} {faceParteDinSesiune(s.id) ? ' - faceti parte' : ' - nu faceti parte'}
                                {!faceParteDinSesiune(s.id) && <>
                                    <input className='form-control' type='number' min={1} max={15} placeholder='Capacitate' name='capacitateStudenti' value={capacitateStudenti} onChange={e => setCap(e.target.value)}></input>
                                    <button onClick={() => participaLaSesiune(s.id)} className='btn btn-secondary'>Participa</button>
                                </>}
                            </div>
                        ))}
                        {message && <div className={"alert m-2 text-boldd " + (error ? ' alert-danger ' : 'alert-success ')} role="alert">
                            {message}
                        </div>}
                    </div>
                </div>
            </div>
            <h2>Lista studentilor cu solicitari active</h2>
            {!studenti || studenti?.length <= 0 && <h4 className='text-danger'>Nu aveti studenti.</h4>}
            <div className="list-group">
                {studenti.map((student) => (
                    <div key={student.id} className=" row">
                        <div className='card col-md-3'>{student.nume} {student.prenume} {student.email}</div>
                        <div className='card col-md-9'>
                            {eAcceptat(student) === 1 ?
                                <div className="row">
                                    <div className='text-success'>Acceptat</div>
                                    {areCerere(student) && (
                                        <div className="row">
                                            <div className="col-sm-2">
                                                <button className='btn btn-secondary' onClick={() => descarcaCerere(student)}>Descarca pdf</button>
                                            </div>
                                            <div className="col-sm-5 mb-3">
                                                <input accept=".pdf" required type="file" min={new Date()} className="form-control" id="dataInceput" name="dataInceput" onChange={incarcaCerere} />
                                                <button type="button" disabled={!fisier} className="btn btn-primary" onClick={() => trimiteRaspuns(2, student.Colaborare.id, true)}>Trimite</button>
                                            </div>
                                            <div className="col-sm-2">
                                                <input type='text' className="mx-1" placeholder='Motiv refuz' ref={motivRefuz}></input>
                                                <button type="button" className="btn btn-danger" onClick={() => trimiteRaspuns(3, student.Colaborare.id)}>
                                                    Refuza
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                : (eAcceptat(student) === 0 ? <p className='text-danger'>Respins</p> :
                                    (eAcceptat(student) === 2 ? <p className='text-primary'>Cerere trimisa</p> : (
                                        eAcceptat(student) === 3 ? <p className='text-danger'>Cerere respinsa</p> : <>
                                            <button type="button" className="btn btn-success" onClick={() => trimiteRaspuns(1, student.Colaborare.id)}>
                                                Accepta
                                            </button>{' '}
                                            <input type='text' className="mx-1" placeholder='Motiv refuz' ref={motivRefuz}></input>
                                            <button type="button" className="btn btn-danger" onClick={() => trimiteRaspuns(0, student.Colaborare.id)}>
                                                Refuza
                                            </button>
                                        </>
                                    )))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PaginaSesiuni;