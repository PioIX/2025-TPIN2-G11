"use client";
import React from "react";
import RandomRole from "../../components/randomRole.js";
import { useState } from "react";
import Button from "@/components/button.js";

export default function Page() {
    const [playersAmount, setPlayersAmount] = useState(6);
    const [roles, setRoles] = useState([])
    
    const onChangePlayersAmount = (event) => {
        setPlayersAmount(Number(event.target.value));
    };

    function randomRole() {
        alert(Math.floor(Math.random() * (playersAmount)))
    }

for(let i=0; i<playersAmount; i++){
    Math.floor(Math.random() * (playersAmount))
}
    

    return (
        <>
            <input
                type="number"
                min="6"
                max="16"
                value={playersAmount}
                onChange={onChangePlayersAmount}
            />
            <Button
                onClick={randomRole}
                title="Aleatorizar rol"/>
        </>
    );
}