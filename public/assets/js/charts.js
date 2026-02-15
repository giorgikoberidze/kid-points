// Chart.js initialization for reports page
document.addEventListener('DOMContentLoaded', function() {
    const chartDataEl = document.getElementById('chartData');
    if (!chartDataEl) return;

    const chartData = JSON.parse(chartDataEl.textContent);

    // Points over time - Line chart
    const timeCtx = document.getElementById('pointsOverTimeChart');
    if (timeCtx && chartData.pointsOverTime) {
        new Chart(timeCtx, {
            type: 'line',
            data: {
                labels: chartData.pointsOverTime.labels,
                datasets: [{
                    label: 'Points',
                    data: chartData.pointsOverTime.data,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: '#6366f1',
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // Points by category - Doughnut chart
    const catCtx = document.getElementById('pointsByCategoryChart');
    if (catCtx && chartData.byCategory) {
        new Chart(catCtx, {
            type: 'doughnut',
            data: {
                labels: chartData.byCategory.labels,
                datasets: [{
                    data: chartData.byCategory.data,
                    backgroundColor: [
                        '#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6',
                        '#8b5cf6', '#14b8a6', '#f97316', '#ec4899', '#06b6d4',
                        '#84cc16', '#a855f7', '#10b981', '#e11d48', '#0ea5e9'
                    ],
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }

    // Child comparison - Bar chart
    const compCtx = document.getElementById('childComparisonChart');
    if (compCtx && chartData.childComparison) {
        new Chart(compCtx, {
            type: 'bar',
            data: {
                labels: chartData.childComparison.labels,
                datasets: [{
                    label: 'Points',
                    data: chartData.childComparison.data,
                    backgroundColor: chartData.childComparison.data.map(function(v) {
                        return v >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)';
                    }),
                    borderRadius: 8,
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
});
