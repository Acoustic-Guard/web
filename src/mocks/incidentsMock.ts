import type { Alert } from "../types/incidents";

import type { IncidentMarker } from '../types/incidents';



export const incidents: IncidentMarker[] = [

  { id: '1', lat: 50.4541, lng: 30.5284, type: 'UAV',       intensity: 0.92 },

  { id: '2', lat: 50.4401, lng: 30.5134, type: 'Explosion', intensity: 0.88 },

  { id: '3', lat: 50.4601, lng: 30.4934, type: 'Siren',     intensity: 0.76 },

  { id: '4', lat: 50.4321, lng: 30.5434, type: 'Generator', intensity: 0.64 },

  { id: '5', lat: 50.4712, lng: 30.5110, type: 'UAV',       intensity: 0.81 },

];



export const alerts: Alert[] = [

    {

      id: '1',

      type: 'UAV',

      timestamp: '2026-05-18 14:23:45',

      confidence: 0.92,

      location: 'Sector 7-B, Grid 45.2',

    },

    {

      id: '2',

      type: 'Explosion',

      timestamp: '2026-05-18 14:21:12',

      confidence: 0.88,

      location: 'Sector 3-A, Grid 22.8',

    },

    {

      id: '3',

      type: 'Siren',

      timestamp: '2026-05-18 14:18:33',

      confidence: 0.76,

      location: 'Sector 5-C, Grid 34.1',

    },

    {

      id: '4',

      type: 'Generator',

      timestamp: '2026-05-18 14:15:08',

      confidence: 0.64,

      location: 'Sector 2-D, Grid 18.5',

    },

    {

      id: '5',

      type: 'UAV',

      timestamp: '2026-05-18 14:12:56',

      confidence: 0.81,

      location: 'Sector 8-A, Grid 51.3',

    },

    {

      id: '6',

      type: 'Siren',

      timestamp: '2026-05-18 14:09:22',

      confidence: 0.71,

      location: 'Sector 4-B, Grid 28.7',

    },

  ];



  