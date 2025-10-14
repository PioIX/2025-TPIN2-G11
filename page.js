"use client"; 
import AgendarNuevoTurno from '@/components/agendarNuevoTurno';
import Turnos from '@/components/turnos';
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';


export default function PaginaTurnos(){
    
    const socketRef = useRef(null); 
    const[especialidad, setEspecialidad]= useState("");
    const [turnoActual, setTurnoActual] = useState(0);
    const [pacienteActual, setPacienteActual] = useState("");
    const [cantidadReservas, setCantidadReservas] =useState(0);
    const [timestamp, setTimesTamp] = useState("")

   useEffect(() => {
    
    socketRef.current = io('http://10.1.5.137:4000', {
      transports: ['websocket'], 
    });

    socketRef.current.on('connect', () => {
      console.log(' Conectado al servidor WebSocket');
      setEstaConectado(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log(' Desconectado del servidor WebSocket');
      setEstaConectado(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Error de conexión:', error);
      setEstaConectado(false);
    });

    return () => {
      socketRef.current.disconnect();
    };

  }, []);

    
    

    return(
        <>
            <Turnos
                especialidad={}
                numeroTurno={}
                nombrePaciente={}
                cantTurnosReservados={}></Turnos>
            <AgendarNuevoTurno
                onChangeNumeroTurno={}
                onClickRealizarReservaDeTurno={}
                ></AgendarNuevoTurno>
        </>
        
    );

}