/**
 * Fare Calculation Utility for Frontend
 * Mirrors the backend fare calculation logic
 */

export interface FareStructure {
    minimumFare: number;
    perKilometerRate: number;
    waitingChargePerMinute?: number;
}

export function calculateFare(
    distanceInKm: number,
    durationInSeconds: number = 0,
    fareStructure: FareStructure = {
        minimumFare: 50,
        perKilometerRate: 15,
        waitingChargePerMinute: 1,
    }
): number {
    // Calculate distance-based fare
    const distanceFare = distanceInKm * fareStructure.perKilometerRate;

    // Calculate waiting charges (if duration provided and waiting charge is set)
    const durationInMinutes = Math.ceil(durationInSeconds / 60);
    const waitingChargePerMinute = fareStructure.waitingChargePerMinute || 0;
    const waitingCharge = durationInMinutes * waitingChargePerMinute;

    // Total fare = distance fare + waiting charge
    const totalFare = distanceFare + waitingCharge;

    // Return the maximum of minimum fare and calculated fare
    return Math.max(fareStructure.minimumFare, totalFare);
}
