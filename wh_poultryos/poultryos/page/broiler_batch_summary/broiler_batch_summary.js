frappe.pages['Broiler Batch Summary'].on_page_load = function (wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Broiler Batch Summary',
        single_column: true
    });

    page.main.append(`
        <div class="container-fluid broiler-batch-summary">
            <!-- Page Header -->
            <div class="page-header row mb-4">
                <div class="col-md-6">
                    <h1 class="page-title">Broiler Batch Summary</h1>
                </div>
                <div class="col-md-6 text-right">
                    <div class="btn-group print-export-options">
                        <button id="batch-select" class="btn btn-primary dropdown-toggle" data-toggle="dropdown">
                            Select Batch
                        </button>
                        <div id="batch-dropdown" class="dropdown-menu">
                            <!-- Batch options will be dynamically populated -->
                        </div>
                        <button id="print-page" class="btn btn-outline-secondary">
                            <i class="fa fa-print"></i> Print
                        </button>
                        <button id="download-pdf" class="btn btn-outline-primary">
                            <i class="fa fa-file-pdf-o"></i> PDF
                        </button>
                        <button id="download-excel" class="btn btn-outline-success">
                            <i class="fa fa-file-excel-o"></i> Excel
                        </button>
                    </div>
                </div>
            </div>

            <!-- Activity Heatmap Section -->
            <div class="section activity-heatmap mb-4">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Batch Activity Heatmap</h3>
                    </div>
                    <div class="card-body">
                        <div id="batch-activity-heatmap" class="activity-heatmap"></div>
                    </div>
                </div>
            </div>

            <!-- Performance Tiles Section -->
            <div class="section performance-tiles mb-4">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Performance Metrics</h3>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-3 mb-3">
                                <div class="tile tile-placed-qty">
                                    <h4>Placed Quantity</h4>
                                    <div class="tile-value" id="placed-quantity">0</div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-3">
                                <div class="tile tile-live-qty">
                                    <h4>Live Quantity</h4>
                                    <div class="tile-value" id="live-quantity">0</div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-3">
                                <div class="tile tile-first-week-mortality">
                                    <h4>First Week Mortality</h4>
                                    <div class="tile-value" id="first-week-mortality">0%</div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-3">
                                <div class="tile tile-total-mortality">
                                    <h4>Total Mortality</h4>
                                    <div class="tile-value" id="total-mortality">0%</div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-3">
                                <div class="tile tile-fcr">
                                    <h4>FCR</h4>
                                    <div class="tile-value" id="fcr">0</div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-3">
                                <div class="tile tile-body-weight">
                                    <h4>Body Weight</h4>
                                    <div class="tile-value" id="body-weight">0 kg</div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-3">
                                <div class="tile tile-eef">
                                    <h4>EEF</h4>
                                    <div class="tile-value" id="eef">0</div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-3">
                                <div class="tile tile-production-cost">
                                    <h4>Production Cost</h4>
                                    <div class="tile-value" id="production-cost">0</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Comparative Charts Section -->
            <div class="section comparative-charts mb-4">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Performance Comparison</h3>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-12 mb-3">
                                <h5>Mortality: Standard vs Actual</h5>
                                <canvas id="mortality-chart"></canvas>
                            </div>
                        </div>
                            
                        <div class="row">
                            <div class="col-md-12 mb-3">
                                <h5>Feed Consumption: Standard vs Actual</h5>
                                <canvas id="feed-consumption-chart"></canvas>
                            </div>
                        </div>
                            
                        <div class="row">
                            <div class="col-md-12 mb-3">
                                <h5>FCR: Standard vs Actual</h5>
                                <canvas id="fcr-chart"></canvas>
                            </div>
                        </div>
                            
                        <div class="row">
                            <div class="col-md-12 mb-3">
                                <h5>Avg Body Weight: Standard vs Actual</h5>
                                <canvas id="body-weight-chart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Daily Transactions Section -->
            <div class="section daily-transactions mb-4">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Daily Transactions</h3>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table id="daily-transactions-table" class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Transaction Type</th>
                                        <th>Quantity</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody id="daily-transactions-body">
                                    <!-- Transactions will be dynamically populated -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <style>
            /* Performance Tiles Styling */
            .tile {
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                padding: 15px;
                text-align: center;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                transition: all 0.3s ease;
            }

            .tile:hover {
                transform: translateY(-5px);
                box-shadow: 0 6px 8px rgba(0,0,0,0.15);
            }

            .tile h4 {
                color: #6c757d;
                margin-bottom: 10px;
                font-size: 14px;
                text-transform: uppercase;
            }

            .tile-value {
                font-size: 24px;
                font-weight: bold;
                color: #007bff;
            }

            /* Responsive Adjustments */
            @media (max-width: 768px) {
                .tile {
                    margin-bottom: 15px;
                }
            }

            /* Print Styles */
            @media print {
                .print-export-options {
                    display: none;
                }
                .card {
                    border: 1px solid #ddd;
                }
            }
        </style>

        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.5/xlsx.full.min.js"></script>
    `);

    $(document).ready(function () {
        // Batch Selection Functionality
        function populateBatchDropdown() {
            frappe.call({
                method: "wh_poultryos.poultryos.page.broiler_batch_summary.broiler_batch_summary.get_broiler_batches",
                callback: function (response) {
                    const batches = response.message;
                    const dropdown = $('#batch-dropdown');
                    dropdown.empty();

                    batches.forEach(batch => {
                        dropdown.append(`
							<a class="dropdown-item batch-select-option" href="#" data-batch-id="${batch.name}">
								${batch.batch_name}
							</a>
						`);
                    });

                    // Batch Selection Event
                    $('.batch-select-option').on('click', function () {
                        const batchName = $(this).text();
                        const batchId = $(this).data('batch-id');
                        $('#batch-select').text(batchName);
                        fetchBatchData(batchId);
                    });
                }
            });
        }

        // Fetch Batch Data
        function fetchBatchData(batchId) {
            frappe.call({
                method: "wh_poultryos.poultryos.page.broiler_batch_summary.broiler_batch_summary.get_batch_summary_data",
                args: { batch_name: batchId },
                callback: function (response) {
                    const data = response.message;

                    // Update Performance Tiles
                    updatePerformanceTiles(data);

                    // Render Activity Heatmap
                    renderActivityHeatmap(data.activity_data);

                    // Update Comparative Charts
                    updateComparativeCharts(data.charts_data);

                    // Populate Daily Transactions
                    populateDailyTransactions(data.transactions);
                }
            });
        }

        // Update Performance Tiles
        function updatePerformanceTiles(data) {
            $('#placed-quantity').text(data.placed_quantity || 0);
            $('#live-quantity').text(data.live_quantity || 0);
            $('#first-week-mortality').text(`${data.first_week_mortality || 0}%`);
            $('#total-mortality').text(`${data.total_mortality || 0}%`);
            $('#fcr').text(data.fcr || 0);
            $('#body-weight').text(`${data.body_weight || 0} kg`);
            $('#eef').text(data.eef || 0);
            $('#production-cost').text(`₹${data.production_cost || 0}`);
        }

        // Render Activity Heatmap
        function renderActivityHeatmap(activityData) {
            const heatmapContainer = $('#batch-activity-heatmap');
            heatmapContainer.empty();

            if (activityData && activityData.length) {
                new frappe.Chart(heatmapContainer[0], {
                    type: 'heatmap',
                    width: 960,
                    data: {
                        dataPoints: activityData,
                        start: new Date(activityData[0].date),
                        end: new Date(activityData[activityData.length - 1].date)
                    },
                    discreteDomains: 1
                });
            }
        }

        // Update Comparative Charts with Fallback
        function updateComparativeCharts(chartsData) {
            // Ensure default values if data is missing
            const defaultChartData = {
                mortality_std: [0, 0, 0, 0, 0, 0],
                mortality_actual: [0, 0, 0, 0, 0, 0],
                feed_std: [0, 0, 0, 0, 0, 0],
                feed_actual: [0, 0, 0, 0, 0, 0],
                fcr_std: [0, 0, 0, 0, 0, 0],
                fcr_actual: [0, 0, 0, 0, 0, 0],
                weight_std: [0, 0, 0, 0, 0, 0],
                weight_actual: [0, 0, 0, 0, 0, 0]
            };

            // Merge provided data with defaults
            const mergedChartsData = { ...defaultChartData, ...chartsData };

            // Store global data for export
            window.mortalityStdData = mergedChartsData.mortality_std;
            window.mortalityActualData = mergedChartsData.mortality_actual;
            window.feedStdData = mergedChartsData.feed_std;
            window.feedActualData = mergedChartsData.feed_actual;
            window.fcrStdData = mergedChartsData.fcr_std;
            window.fcrActualData = mergedChartsData.fcr_actual;
            window.weightStdData = mergedChartsData.weight_std;
            window.weightActualData = mergedChartsData.weight_actual;

            const chartConfigs = [
                {
                    id: 'mortality-chart',
                    label: 'Mortality',
                    standardData: mergedChartsData.mortality_std,
                    actualData: mergedChartsData.mortality_actual
                },
                {
                    id: 'feed-consumption-chart',
                    label: 'Feed Consumption',
                    standardData: mergedChartsData.feed_std,
                    actualData: mergedChartsData.feed_actual
                },
                {
                    id: 'fcr-chart',
                    label: 'Feed Conversion Ratio',
                    standardData: mergedChartsData.fcr_std,
                    actualData: mergedChartsData.fcr_actual
                },
                {
                    id: 'body-weight-chart',
                    label: 'Body Weight',
                    standardData: mergedChartsData.weight_std,
                    actualData: mergedChartsData.weight_actual
                }
            ];

            chartConfigs.forEach(config => {
                const ctx = document.getElementById(config.id).getContext('2d');
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
                        datasets: [
                            {
                                label: 'Standard',
                                data: config.standardData,
                                borderColor: 'blue',
                                backgroundColor: 'rgba(0,0,255,0.1)',
                                borderWidth: 2
                            },
                            {
                                label: 'Actual',
                                data: config.actualData,
                                borderColor: 'red',
                                backgroundColor: 'rgba(255,0,0,0.1)',
                                borderWidth: 2
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: config.label
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            });
        }

        // Populate Daily Transactions
        function populateDailyTransactions(transactions) {
            const transactionBody = $('#daily-transactions-body');
            transactionBody.empty();

            transactions.forEach(transaction => {
                transactionBody.append(`
					<tr>
						<td>${transaction.date}</td>
						<td>${transaction.type}</td>
						<td>${transaction.quantity}</td>
						<td>${transaction.details || 'N/A'}</td>
					</tr>
				`);
            });
        }

        // Export Functionality
        $('#print-page').on('click', () => window.print());

        $('#download-pdf').on('click', generatePDF);
        $('#download-excel').on('click', generateExcel);

        // Initial Setup
        populateBatchDropdown();
    });
};

// Additional CSS for fine-tuning
$(`
<style>
    .broiler-batch-summary {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
    }
</style>
`).appendTo('head');

// Placeholder Export Functions (to be implemented with actual data)
function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    let yOffset = 10;

    // Title
    doc.setFontSize(18);
    doc.text('Broiler Batch Summary', 10, yOffset);
    yOffset += 10;

    // Performance Tiles Section
    doc.setFontSize(14);
    doc.text('Performance Metrics', 10, yOffset);
    yOffset += 10;

    doc.setFontSize(10);
    const tiles = [
        { label: 'Placed Quantity', value: $('#placed-quantity').text() },
        { label: 'Live Quantity', value: $('#live-quantity').text() },
        { label: 'First Week Mortality', value: $('#first-week-mortality').text() },
        { label: 'Total Mortality', value: $('#total-mortality').text() },
        { label: 'FCR', value: $('#fcr').text() },
        { label: 'Body Weight', value: $('#body-weight').text() },
        { label: 'EEF', value: $('#eef').text() },
        { label: 'Production Cost', value: $('#production-cost').text() }
    ];

    tiles.forEach((tile, index) => {
        doc.text(`${tile.label}: ${tile.value}`, 10, yOffset + (index * 7));
    });
    yOffset += tiles.length * 7 + 10;

    // Daily Transactions Section
    doc.setFontSize(14);
    doc.text('Daily Transactions', 10, yOffset);
    yOffset += 10;

    doc.setFontSize(10);
    const transactions = [];
    $('#daily-transactions-body tr').each(function () {
        const cells = $(this).find('td');
        transactions.push({
            date: cells.eq(0).text(),
            type: cells.eq(1).text(),
            quantity: cells.eq(2).text(),
            details: cells.eq(3).text()
        });
    });

    // Create a table for transactions
    const headers = ['Date', 'Type', 'Quantity', 'Details'];
    const transactionData = transactions.map(t => [t.date, t.type, t.quantity, t.details]);

    doc.autoTable({
        startY: yOffset,
        head: [headers],
        body: transactionData,
        theme: 'striped'
    });

    doc.save('broiler-batch-summary.pdf');
}

function generateExcel() {
    const wb = XLSX.utils.book_new();

    // Performance Metrics Sheet
    const metricsData = [
        ['Metric', 'Value'],
        ['Placed Quantity', $('#placed-quantity').text()],
        ['Live Quantity', $('#live-quantity').text()],
        ['First Week Mortality', $('#first-week-mortality').text()],
        ['Total Mortality', $('#total-mortality').text()],
        ['FCR', $('#fcr').text()],
        ['Body Weight', $('#body-weight').text()],
        ['EEF', $('#eef').text()],
        ['Production Cost', $('#production-cost').text()]
    ];
    const metricsSheet = XLSX.utils.aoa_to_sheet(metricsData);
    XLSX.utils.book_append_sheet(wb, metricsSheet, 'Performance Metrics');

    // Daily Transactions Sheet
    const transactionHeaders = ['Date', 'Transaction Type', 'Quantity', 'Details'];
    const transactionData = [transactionHeaders];

    $('#daily-transactions-body tr').each(function () {
        const cells = $(this).find('td');
        transactionData.push([
            cells.eq(0).text(),
            cells.eq(1).text(),
            cells.eq(2).text(),
            cells.eq(3).text()
        ]);
    });

    const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionData);
    XLSX.utils.book_append_sheet(wb, transactionsSheet, 'Daily Transactions');

    // Comparative Charts Data Sheets
    const chartMetrics = [
        {
            name: 'Mortality',
            std: window.mortalityStdData,
            actual: window.mortalityActualData
        },
        {
            name: 'Feed Consumption',
            std: window.feedStdData,
            actual: window.feedActualData
        },
        {
            name: 'FCR',
            std: window.fcrStdData,
            actual: window.fcrActualData
        },
        {
            name: 'Body Weight',
            std: window.weightStdData,
            actual: window.weightActualData
        }
    ];

    chartMetrics.forEach(metric => {
        const chartData = [
            ['Week', `${metric.name} Standard`, `${metric.name} Actual`],
            ...metric.std.map((std, index) => [
                `Week ${index + 1}`,
                std,
                metric.actual[index]
            ])
        ];
        const chartSheet = XLSX.utils.aoa_to_sheet(chartData);
        XLSX.utils.book_append_sheet(wb, chartSheet, `${metric.name} Comparison`);
    });

    XLSX.writeFile(wb, 'broiler-batch-summary.xlsx');
}

// Modify the chart rendering function to store global data
function updateComparativeCharts(chartsData) {
    // Store global data for export
    window.mortalityStdData = chartsData.mortality_std;
    window.mortalityActualData = chartsData.mortality_actual;
    window.feedStdData = chartsData.feed_std;
    window.feedActualData = chartsData.feed_actual;
    window.fcrStdData = chartsData.fcr_std;
    window.fcrActualData = chartsData.fcr_actual;
    window.weightStdData = chartsData.weight_std;
    window.weightActualData = chartsData.weight_actual;

    // Existing chart rendering logic remains the same
    const chartConfigs = [
        {
            id: 'mortality-chart',
            label: 'Mortality',
            standardData: chartsData.mortality_std,
            actualData: chartsData.mortality_actual
        }, {
            id: 'feed-chart',
            label: 'Feed Consumption',
            standardData: chartsData.feed_std,
            actualData: chartsData.feed_actual
        }, {
            id: 'fcr-chart',
            label: 'FCR',
            standardData: chartsData.fcr_std,
            actualData: chartsData.fcr_actual
        }, {
            id: 'weight-chart',
            label: 'Avg. Bird Weight',
            standardData: chartsData.weight_std,
            actualData: chartsData.weight_actual
        },
        // ... (rest of the existing chart configs)
    ];

    chartConfigs.forEach(config => {
        const canvas = document.getElementById(config.id);
        if (canvas) {
            // Destroy existing chart if it exists
            if (chartInstances[config.id]) {
                chartInstances[config.id].destroy();
            }

            // Create new chart
            const ctx = canvas.getContext('2d');
            chartInstances[config.id] = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    datasets: [{
                        label: config.label,
                        data: config.data,
                        borderColor: config.borderColor,
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        title: {
                            display: true,
                            text: config.label
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    });
}

// Add some additional error handling and logging
$(document).ready(function () {
    // Global error handler
    window.addEventListener('error', function (event) {
        console.error('Unhandled error:', event.error);
        frappe.msgprint({
            title: __('Error'),
            indicator: 'red',
            message: __('An unexpected error occurred. Please check the console for details.')
        });
    });

    // Network status indicators
    $(document).ajaxStart(function () {
        frappe.show_progress('Loading', 0, 100, 'Please wait...');
    });

    $(document).ajaxStop(function () {
        frappe.hide_progress();
    });
});