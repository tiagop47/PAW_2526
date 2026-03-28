const mapaRegisto = document.getElementById('mapa-registo');
const latInput = document.getElementById('input-lat');
const lonInput = document.getElementById('input-lon');
const seletor = document.getElementById('seletor-role');
const camposSuper = document.getElementById('campos-supermercado');
let marcador;

document.addEventListener('DOMContentLoaded', function () {
    if (mapaRegisto) {
        inicializarMapa('mapa-registo');
    }

    if (typeof meuMapa !== 'undefined' && meuMapa) {
        meuMapa.on('click', function (e) {
            const lat = e.latlng.lat;
            const lon = e.latlng.lng;

            if (latInput) {
                latInput.value = lat.toFixed(6);
            }
            if (lonInput) {
                lonInput.value = lon.toFixed(6);
            }

            if (marcador) {
                marcador.setLatLng([lat, lon]);
            } else {
                marcador = L.marker([lat, lon]).addTo(meuMapa);
            }
        });
    }

    if (seletor && camposSuper) {
        seletor.addEventListener('change', function () {
            camposSuper.style.display = (this.value === 'supermercados') ? 'flex' : 'none';

            if (latInput) {
                latInput.required = (this.value === 'supermercados');
            }
            if (lonInput) {
                lonInput.required = (this.value === 'supermercados');
            }
        });

        seletor.dispatchEvent(new Event('change'));
    }
});
