const BASE_ZONES = [
    {
        id: 'jharkhand',
        name: 'Jharkhand',
        riskLevel: 'HIGH',
        sector: 'Dhanbad Coal Belt',
        coords: '23.8°N, 86.4°E',
        defProx: '12 km',
        car: 0.31,
        ndvi: 0.24,
        terrain: 68,
        moisture: 42,
        seismic: 2.4,
        carTrend: [0.38, 0.36, 0.35, 0.34, 0.33, 0.32, 0.31, 0.30, 0.31, 0.30, 0.29, 0.31],
        ndviTrend: [0.30, 0.29, 0.28, 0.27, 0.26, 0.25, 0.24, 0.23, 0.25, 0.23, 0.22, 0.24],
        moistTrend: [48, 46, 44, 43, 42, 41, 42, 41, 40, 42, 41, 42],
        seismicTrend: [1.2, 1.4, 1.8, 2.1, 2.0, 2.2, 2.4, 2.3, 2.4, 2.5, 2.3, 2.4],
        alerts: [
            { time: '06:14', level: 'high', msg: 'Seismic spike 2.4R — Zone 7A' },
            { time: '04:30', level: 'med', msg: 'Landslide probability elevated — Sector C2' },
            { time: '01:15', level: 'low', msg: 'Water table within safe parameters' },
        ]
    },
    {
        id: 'odisha',
        name: 'Odisha',
        riskLevel: 'MEDIUM',
        sector: 'Keonjhar Iron Belt',
        coords: '21.9°N, 85.6°E',
        defProx: '28 km',
        car: 0.54,
        ndvi: 0.48,
        terrain: 38,
        moisture: 61,
        seismic: 1.1,
        carTrend: [0.61, 0.60, 0.59, 0.58, 0.57, 0.56, 0.55, 0.54, 0.55, 0.54, 0.53, 0.54],
        ndviTrend: [0.55, 0.53, 0.52, 0.51, 0.50, 0.49, 0.48, 0.47, 0.49, 0.48, 0.47, 0.48],
        moistTrend: [65, 63, 62, 61, 62, 61, 60, 61, 60, 61, 62, 61],
        seismicTrend: [0.8, 0.9, 0.9, 1.0, 1.1, 1.0, 1.1, 1.2, 1.1, 1.1, 1.0, 1.1],
        alerts: [
            { time: '05:52', level: 'med', msg: 'Vegetation loss detected in grid B4' },
            { time: '03:20', level: 'low', msg: 'Iron ore extraction within permitted limits' },
        ]
    },
    {
        id: 'chhattisgarh',
        name: 'Chhattisgarh',
        riskLevel: 'LOW',
        sector: 'Bastar Forest Reserve',
        coords: '19.1°N, 81.7°E',
        defProx: '47 km',
        car: 0.78,
        ndvi: 0.71,
        terrain: 18,
        moisture: 74,
        seismic: 0.6,
        carTrend: [0.82, 0.81, 0.80, 0.80, 0.79, 0.79, 0.78, 0.78, 0.79, 0.78, 0.77, 0.78],
        ndviTrend: [0.75, 0.74, 0.73, 0.72, 0.72, 0.71, 0.71, 0.70, 0.72, 0.71, 0.70, 0.71],
        moistTrend: [76, 75, 74, 74, 74, 73, 74, 73, 74, 74, 73, 74],
        seismicTrend: [0.4, 0.4, 0.5, 0.5, 0.6, 0.5, 0.6, 0.6, 0.5, 0.6, 0.6, 0.6],
        alerts: [
            { time: '02:44', level: 'low', msg: 'All terrain metrics within safe parameters' },
        ]
    }
];

export function getLiveZones() {
    return BASE_ZONES.map(z => ({
        ...z,
        car: parseFloat((z.car + (Math.random() - 0.5) * 0.01).toFixed(3)),
        ndvi: parseFloat((z.ndvi + (Math.random() - 0.5) * 0.01).toFixed(3)),
        moisture: parseFloat((z.moisture + (Math.random() - 0.5) * 1).toFixed(1)),
        seismic: parseFloat((z.seismic + (Math.random() - 0.5) * 0.05).toFixed(2)),
    }));
}

export function getBaseZones() {
    return BASE_ZONES;
}
