function main() {
    var options = {
        scrollWheelZoom: true,
        center: [55.5, 38],
        zoomControl: true,
        zoom: 16,
        buffer: 16
    };

    var map = L.map('map', options);

    map.createPane('labels');

    var OpenStreetMap_Mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    var boundingBox;
    var bounds;
    L.GridLayer.DebugCoords = L.GridLayer.extend({
        // {x, y, z}
        createTile: function (coords) {
            if (coords.z < 12) {
                const emptyDiv = document.createElement('div')
                emptyDiv.style.outline = '1px solid blue';
                emptyDiv.innerHTML = 'z:' + [coords.z, coords.x, coords.y].join(', ');
                return emptyDiv;
            }

            let latDegreeSum = tile2lat(coords.y, coords.z - 2);
            let lonStartDegree = tile2long(coords.x, coords.z - 2);
            let latDegreeSumNext = tile2lat(coords.y + 1, coords.z - 2);
            let lonStartDegreeNext = tile2long(coords.x + 1, coords.z - 2);

            const minXY = convertToMercatorTurf([lonStartDegree, latDegreeSum]).geometry.coordinates;
            const maxXY = convertToMercatorTurf([lonStartDegreeNext, latDegreeSumNext]).geometry.coordinates;

            let tile = document.createElement('img');
            tile.src = `http://localhost:4040/arcgis/rest/services/PKK6/CadastreObjects/MapServer/export?layers=show%3A30%2C27%2C24%2C23%2C22&dpi=96&format=PNG32&bbox=${minXY[0]}%2C${minXY[1]}%2C${maxXY[0]}%2C${maxXY[1]}&bboxSR=102100&imageSR=102100&size=1024%2C1024&transparent=true&f=image`;
            return tile;
        }
    });


    L.gridLayer.debugCoords = function (opts) {
        return new L.GridLayer.DebugCoords(opts);
    };

    map.addLayer(L.gridLayer.debugCoords({
        tileSize: 1024,
        noWrap: true
    }));

    map.on('click', function (ev) {
        var latlng = map.mouseEventToLatLng(ev.originalEvent);
        console.log(latlng.lat + ', ' + latlng.lng);
        fetch(`http://localhost:4040/api/features/?text=${latlng.lat}+${latlng.lng}&tolerance=32&types=[2,3,4,1,21,5]&_=1633209527925`)
            .then(res => res.json())
            .then(res => {
                return res?.results.find(r => r.type === 1) || res?.find(r => r.type === 2) || res?.find(r => r.type === 3) || res?.find(r => r.type === 4)
            })
            .then(item => {
                console.log(item);
                if (!item) return;
                return fetch(`http://localhost:4040/api/features/1/${item.attrs.id}?date_format=%c&_=${Date.now()}`)
            })
            .then(res => res.json())
            .then(res => {
                console.log(JSON.stringify(res.feature.attrs, null, '\n\t'))
            });

    });
}


window.onload = main;

/**
 * @param {Array<number>} lonLat WGS84 point
 * @returns {Array<number>} Mercator [x, y] point
 */
function convertToMercatorTurf(lonLat) {
    let pt = turf.point(lonLat);
    return turf.toMercator(pt);
}

/**
 *
 * @param x
 * @param z
 * @returns {number}
 */
function tile2long(x, z) {
    return (x / Math.pow(2, z) * 360 - 180);
}

/**
 *
 * @param y
 * @param z
 * @returns {number}
 */
function tile2lat(y, z) {
    var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
}


