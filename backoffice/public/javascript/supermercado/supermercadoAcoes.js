(function() {
    const COORDENADAS_CONCELHOS = {
        "Lousada": [41.2777, -8.2814],
        "Porto": [41.1579, -8.6291],
        "Felgueiras": [41.3653, -8.1994],
        "Penafiel": [41.2075, -8.2831]
    };

    const latInput = document.getElementById('input-lat');
    const lonInput = document.getElementById('input-lon');
    const inputsMetodo = document.querySelectorAll('input[name="metodosEntrega"]');
    const seletor = document.getElementById('seletor-role');
    const camposSuper = document.getElementById('campos-supermercado');
    const seletorConcelho = document.getElementById('seletor-concelho');

    let mapaEdicao = null;

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

            mapaEdicao = inicializarMapa('mapa-edicao', lat, lon, 12);
            if (!mapaEdicao) {
                return;
            }

            configurarCliqueMarcador(mapaEdicao, latInput, lonInput);
            setTimeout(function () { mapaEdicao.invalidateSize(); }, 200);
        });
    }

    if (seletorConcelho) {
        seletorConcelho.addEventListener('change', function () {
            const concelho = this.value;
            const coordenadas = COORDENADAS_CONCELHOS[concelho];

            if (coordenadas && mapaEdicao) {
                mapaEdicao.setView(coordenadas, 14);
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
})();