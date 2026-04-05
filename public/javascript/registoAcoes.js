const latInput = document.getElementById('input-lat');
const lonInput = document.getElementById('input-lon');
const seletor = document.getElementById('seletor-role');
const camposSuper = document.getElementById('campos-supermercado');

document.addEventListener('DOMContentLoaded', function () {
    const mapaRegisto = document.getElementById('mapa-registo');

    if (mapaRegisto) {
        inicializarMapa('mapa-registo');
        if (meuMapa) {
            configurarCliqueMarcador(meuMapa, latInput, lonInput);
        }
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
