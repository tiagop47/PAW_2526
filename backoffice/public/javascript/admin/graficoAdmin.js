const canvasSupermercados = document.getElementById('graficoSupermercados');
const canvasRegistos = document.getElementById('graficoRegistos');
const canvasFaturacao = document.getElementById('graficoFaturacaoZona');

document.addEventListener('DOMContentLoaded', function () {

    if (canvasRegistos) {
        const dadosRegistos = JSON.parse(canvasRegistos.getAttribute('data-registos'));
        const ctxRegistos = canvasRegistos.getContext('2d');

        new Chart(ctxRegistos, {
            type: 'line',
            data: {
                labels: dadosRegistos.map(d => d.label),
                datasets: [{
                    label: 'Novos Utilizadores',
                    data: dadosRegistos.map(d => d.total),
                    borderColor: '#0d6efd',
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#0d6efd',
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'top' }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }


    if (canvasSupermercados) {
        const ativos = parseInt(canvasSupermercados.getAttribute('data-ativos') || 0);
        const pendentes = parseInt(canvasSupermercados.getAttribute('data-pendentes') || 0);
        const bloqueados = parseInt(canvasSupermercados.getAttribute('data-bloqueados') || 0);
        const ctxSupermercados = canvasSupermercados.getContext('2d');

        new Chart(ctxSupermercados, {
            type: 'doughnut',
            data: {
                labels: ['Ativos', 'Pendentes', 'Bloqueados'],
                datasets: [{
                    data: [ativos, pendentes, bloqueados],
                    backgroundColor: ['#198754', '#ffc107', '#dc3545'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    // Gráfico Faturação
    if (canvasFaturacao) {
        const dadosFaturacao = JSON.parse(canvasFaturacao.getAttribute('data-faturacao'));
        const ctxFaturacao = canvasFaturacao.getContext('2d');

        new Chart(ctxFaturacao, {
            type: 'bar',
            data: {
                labels: dadosFaturacao.labels,
                datasets: dadosFaturacao.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value, index, values) {
                                return value + ' €';
                            }
                        }
                    }
                }
            }
        });
    }
});
