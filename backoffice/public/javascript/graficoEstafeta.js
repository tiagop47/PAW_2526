const chartDataElement = document.getElementById('chart-data');

document.addEventListener('DOMContentLoaded', function () {
    if (!chartDataElement) {
        return;
    }

    const evolucaoMensalStr = chartDataElement.getAttribute('data-evolucao-mensal');
    if (!evolucaoMensalStr) {
        return;
    }

    const evolucaoMensal = JSON.parse(evolucaoMensalStr);

    renderMonthlyEvolutionChart(evolucaoMensal);
});

function renderMonthlyEvolutionChart(evolucaoMensal) {
    const canvas = document.getElementById('evolucaoMensalChart');
    if (!canvas) return;

    const labels = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const data = {
        labels: labels,
        datasets: [{
            label: 'Entregas Concluídas',
            data: evolucaoMensal,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 2,
            tension: 0.3,
            fill: true
        }]
    };

    const config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    };

    new Chart(canvas, config);
}
