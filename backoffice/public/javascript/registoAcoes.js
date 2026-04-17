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

// Distritos e Concelhos - dados locais (sem dependência de API externa)
document.addEventListener('DOMContentLoaded', function() {
    const distritoSelect = document.getElementById('distrito');
    const concelhoSelect = document.getElementById('concelho');

    if (!distritoSelect || !concelhoSelect) return;

    const dadosPorDistrito = {};

    // Carregar dados do ficheiro local estático
    fetch('/data/distritos-concelhos.json')
        .then(res => res.json())
        .then(dados => {
            dados.forEach(d => {
                dadosPorDistrito[d.distrito] = d.concelhos;
                const option = document.createElement('option');
                option.value = d.distrito;
                option.textContent = d.distrito;
                distritoSelect.appendChild(option);
            });
        })
        .catch(err => console.error('Erro ao carregar distritos:', err));

    // Quando mudar o distrito, popular concelhos a partir do cache
    distritoSelect.addEventListener('change', function() {
        const distrito = this.value;
        concelhoSelect.innerHTML = '';
        concelhoSelect.disabled = true;

        if (distrito && dadosPorDistrito[distrito]) {
            concelhoSelect.innerHTML = '<option value="">Selecione o Concelho</option>';
            dadosPorDistrito[distrito].forEach(nome => {
                const option = document.createElement('option');
                option.value = nome;
                option.textContent = nome;
                concelhoSelect.appendChild(option);
            });
            concelhoSelect.disabled = false;
        } else {
            concelhoSelect.innerHTML = '<option value="">Selecione primeiro o Distrito</option>';
        }
    });
});