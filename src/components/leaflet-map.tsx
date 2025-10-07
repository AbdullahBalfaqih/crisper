'use client';

import React from 'react';
import { Map, Marker } from "pigeon-maps";

interface PigeonMapProps {
    center: [number, number];
    zoom: number;
    setCenter: (center: [number, number]) => void;
    setZoom: (zoom: number) => void;
}

const PigeonMap: React.FC<PigeonMapProps> = ({ center, zoom, setCenter, setZoom }) => {
  return (
    <div className="w-full h-full relative">
        <Map 
            center={center} 
            zoom={zoom} 
            onBoundsChanged={({ center, zoom }) => { 
                setCenter(center) 
                setZoom(zoom) 
            }}
        >
            <Marker 
                width={50}
                anchor={center} 
                color="hsl(var(--primary))" 
            />
        </Map>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-8 h-8">
                <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="hsl(var(--primary))">
                    <path d="M16 3A11.013 11.013 0 0 0 5 14c0 6.012 9.284 14.062 10.387 14.88.384.288.94.288 1.325.002C27.716 28.062 37 20.012 37 14A11.013 11.013 0 0 0 16 3zm0 15a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" opacity=".4"/>
                    <path d="M16 1c-8.284 0-15 6.716-15 15 0 9.428 12.453 15.823 14.286 16.82a1.002 1.002 0 0 0 1.428 0C28.547 31.823 41 25.428 41 16 41 7.716 34.284 1 16 1zm0 29C10.835 25.074 3 19.333 3 16 3 8.822 8.822 3 16 3s13 5.822 13 13c0 3.333-7.835 9.074-13 14z"/>
                    <path d="M16 9a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"/>
                </svg>
            </div>
        </div>
    </div>
  );
};

export default PigeonMap;
