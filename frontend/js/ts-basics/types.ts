// INT219 TypeScript Basics Demonstration
// This file demonstrates interfaces, types, and basic TS concepts for the Viva.

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'student' | 'admin' | 'driver';
}

export interface Bus {
    id: string;
    busNumber: string;
    capacity: number;
    seatsAvailable: number;
    status: 'active' | 'inactive' | 'maintenance';
}

export interface Route {
    id: string;
    source: string;
    destination: string;
    stops: string[];
}

export interface LocationUpdate {
    busId: string;
    lat: number;
    lng: number;
    timestamp: Date;
}

// Example function with typing
export function calculateRemainingSeats(bus: Bus): number {
    return bus.seatsAvailable;
}

// Example class implementing an interface
export class BusTrackingSystem {
    private activeBuses: Bus[] = [];

    addBus(bus: Bus): void {
        this.activeBuses.push(bus);
    }

    getActiveBusCount(): number {
        return this.activeBuses.filter(b => b.status === 'active').length;
    }
}
