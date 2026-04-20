const latInput = document.getElementById('input-lat');
const lonInput = document.getElementById('input-lon');
const inputsMetodo = document.querySelectorAll('input[name="metodosEntrega"]');
const seletor = document.getElementById('seletor-role');
const camposSuper = document.getElementById('campos-supermercado');

inputsMetodo.forEach(function (cb) {
    const inputCusto = document.querySelector(`input[name="custoEntregaPorMetodo[${cb.value}]"]`);
    if (!inputCusto) return;

    inputCusto.disabled = !cb.checked;

    cb.addEventListener('change', function () {
        inputCusto.disabled = !cb.checked;
        if (!cb.checked) inputCusto.value = '0.00';
    });
});

if (latInput && lonInput) {
    document.addEventListener('DOMContentLoaded', function () {
        const lat = parseFloat(latInput.value) || 41.2777;
        const lon = parseFloat(lonInput.value) || -8.2814;

        const map = inicializarMapa('mapa-edicao', lat, lon, 12);
        if (!map) {
            return;
        }

        configurarCliqueMarcador(map, latInput, lonInput);
        setTimeout(function () { map.invalidateSize(); }, 200);
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