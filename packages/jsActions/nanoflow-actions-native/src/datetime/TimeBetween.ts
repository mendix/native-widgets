// This file was generated by Mendix Studio Pro.
//
// WARNING: Only the following code will be retained when actions are regenerated:
// - the import list
// - the code between BEGIN USER CODE and END USER CODE
// - the code between BEGIN EXTRA CODE and END EXTRA CODE
// Other code you write will be lost the next time you deploy the project.
import { Big } from "big.js";

// BEGIN EXTRA CODE
// END EXTRA CODE

type UnitOfTime = "MILLISECOND" | "SECOND" | "MINUTE" | "HOUR" | "DAY";

/**
 * TimeBetween
 * The TimeBetween function calculates the difference between the input Date and times in milliseconds, seconds, minutes, hours or days, depending on the ENUM_UnitOfTime provided.
 *
 * Input Parameters
 * startDate: DateTime
 * endDate: DateTime
 * unitOfTime: ENUM_UnitOfTime
 *
 * Output
 * The action will return the difference between the two dates, as a Decimal, measured in milliseconds, seconds, minutes, hours or days, depending on the value of ENUM_UnitOfTime.
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {"MILLISECOND"|"SECOND"|"MINUTE"|"HOUR"|"DAY"} unitOfTime
 * @returns {Promise.<Big>}
 */
export async function TimeBetween(startDate: Date, endDate: Date, unitOfTime: UnitOfTime): Promise<Big> {
    // BEGIN USER CODE

    if (startDate == null) {
        throw new Error("Required field: startDate");
    }

    if (endDate == null) {
        throw new Error("Required field: endDate");
    }

    if (unitOfTime == null) {
        throw new Error("Required field: unitOfTime");
    }

    const difference = endDate.getTime() - startDate.getTime();

    function getDiff(difference: number, unit: UnitOfTime): number {
        switch (unit) {
            case "MILLISECOND":
                return difference;
            case "SECOND":
                return difference / 1000;
            case "MINUTE":
                return difference / 60000;
            case "HOUR":
                return difference / 3600000;
            case "DAY":
                return difference / 86400000;
            default:
                throw new Error("Unit of time not supported: " + unit);
        }
    }

    return new Big(getDiff(difference, unitOfTime));

    // END USER CODE
}
