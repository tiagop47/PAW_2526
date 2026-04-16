/**
 * Este evento é executado, quando o conteúdo da página da dashboard estiver totalmente,
 * carregado enviando assim os dois gráficos para a página.
 */
document.addEventListener('DOMContentLoaded', function () {
    
    const topSupermarketsElement = document.getElementById('chart-data1');
    const topSupermarkets = JSON.parse(topSupermarketsElement.getAttribute('data-top-supermarkets'));

    supermarketStatsChart(topSupermarkets);
})

/**
 * Esta função cria um gráfico de barras, responsável por apresentar os supermercados
 * com mais vendas, neste caso com mais orders associadas.
 * 
 * @param {*} topSupermarkets o top 5 de supermercados com mais vendas.
 */
function supermarketStatsChart(topSupermarkets) {
    const labels = [];
    const numbOrders = [];

    topSupermarkets.forEach(supermarket => {
      labels.push(supermarket.nome);
      numbOrders.push(supermarket.counter);
    })
    
    const data = {
        labels: labels,
        datasets: [{
            label: 'Supermercados com mais vendas',
            data: numbOrders,
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(255, 159, 64, 0.2)',
                'rgba(255, 205, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(54, 162, 235, 0.2)'
            ],
            borderColor: [
                'rgb(255, 99, 132)',
                'rgb(255, 159, 64)',
                'rgb(255, 205, 86)',
                'rgb(75, 192, 192)',
                'rgb(54, 162, 235)'
            ],
            borderWidth: 1
        }]
    };

    const config = {
        type: 'bar',
        data: data,
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1 
                    }
                }
            }
        },
    };

    const myChart = new Chart(
        document.getElementById('myChart'),
        config
    );
}



