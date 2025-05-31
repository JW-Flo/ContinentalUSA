/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * Sync visit data
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static postV1Sync(
        requestBody: {
            id: string;
            time: string;
            lat: number;
            lon: number;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/sync',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get anchor points for 60-day itinerary
     * @returns any List of anchor points with coordinates and timing
     * @throws ApiError
     */
    public static getV1Anchors(): CancelablePromise<Array<{
        /**
         * Unique identifier for the anchor point
         */
        id: string;
        /**
         * Location name
         */
        name: string;
        /**
         * Latitude coordinate
         */
        lat: number;
        /**
         * Longitude coordinate
         */
        lon: number;
        /**
         * Expected arrival date
         */
        date: string;
        /**
         * Day number in the 60-day itinerary
         */
        day: number;
        /**
         * Optional notes about this stop
         */
        notes?: string;
    }>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/anchors',
        });
    }
}
