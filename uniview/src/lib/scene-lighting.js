define(function (require, exports, module) {
    module.exports =  [
        [0.00, 0, 1.00],
        [0.12, 2, 0.95, 4, 0.45],
        [0.12, 1, 0.74, 2, 0.68],
        [0.12, 0, 0.15, 1, 0.74, 2, 0.68],
        [0.12, 0, 0.15, 1, 0.74, 2, 0.45, 3, 0.15],
        [0.12, 1, 0.68, 2, 0.40, 3, 0.15, 4, 0.23, 5, 0.23],
        [0.05, 0, 0.15, 1, 0.85, 2, 0.45, 3, 0.10, 4, 0.10, 5, 0.10],
    ].map(data => {
        const directions = [
            0, 0, -1, // (0) front,
            -1, -1, -1, // (1) top right,
            1, -1, -1, // (2) top left,
            0, -1, -1, // (3) top,
            -1, 1, -1, // (4) bottom right
            1, 1, -1, // (5) bottom left,
            0, 1, -1, // (6) bottom,
        ];
        let preset = [],
            lightCount = (data.length - 1) >> 1;
        for (let i = 0; i < lightCount; ++i) {
            const d = 3 * data[1 + 2 * i];
            preset.push({
                color: [1, 1, 1],
                direction: [directions[d], directions[d + 1], directions[d + 2]],
                intensity: data[2 + 2 * i],
                ambientIntensity: i == 0 ? data[0] : 0
            });
        }
        return preset;
    });
});

