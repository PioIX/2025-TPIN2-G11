"use client";
import React from "react";
import RandomRole from "../../components/randomRole.js";
import { useState } from "react";
import Button from "@/components/button.js";

export default function Page() {
    const [playersAmount, setPlayersAmount] = useState(6);
    const onChangePlayersAmount = (event) => {
        setPlayersAmount(Number(event.target.value));
    };

    function randomRole() {
        alert("saddsa")
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