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
                                    <span>Placed Quantity</span>
                                    <div class="tile-value" id="placed-quantity">0</div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-3">
                                <div class="tile tile-live-qty">
                                    <span>Live Quantity</span>
                                    <div class="tile-value" id="live-quantity">0</div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-3">
                                <div class="tile tile-first-week-mortality">
                                    <span>First Week Mortality</span>
                                    <div class="tile-value" id="first-week-mortality">0%</div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-3">
                                <div class="tile tile-total-mortality">
                                    <span>Total Mortality</span>
                                    <div class="tile-value" id="total-mortality">0%</div>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-3 mb-3">
                                <div class="tile tile-fcr">
                                    <span>FCR</span>
                                    <div class="tile-value" id="fcr">0</div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-3">
                                <div class="tile tile-body-weight">
                                    <span>Body Weight</span>
                                    <div class="tile-value" id="body-weight">0 kg</div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-3">
                                <div class="tile tile-eef">
                                    <span>EEF</span>
                                    <div class="tile-value" id="eef">0</div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-3">
                                <div class="tile tile-production-cost">
                                    <span>Production Cost</span>
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
                        <h3 class="card-title">Performance Comparison - Mortality: Standard vs Actual</h3>
                    </div>
                    <div class="card-body">
                        <div class="row chart-row">
                            <div class="col-md-12 mb-12">
                                <canvas id="mortality-chart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Comparative Charts Section -->
            <div class="section comparative-charts mb-4">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Performance Comparison - Feed Consumption: Standard vs Actual</h3>
                    </div>
                    <div class="card-body">
                        <div class="row chart-row">
                            <div class="col-md-12 mb-12">
                                <canvas id="feed-consumption-chart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Comparative Charts Section -->
            <div class="section comparative-charts mb-4">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Performance Comparison - FCR: Standard vs Actual</h3>
                    </div>
                    <div class="card-body">
                        <div class="row chart-row">
                            <div class="col-md-12 mb-12">
                                <canvas id="fcr-chart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Comparative Charts Section -->
            <div class="section comparative-charts mb-4">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Performance Comparison - Avg Body Weight: Standard vs Actual</h3>
                    </div>
                    <div class="card-body">
                        <div class="row chart-row">
                            <div class="col-md-12 mb-12">
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
                                        <th>Mortality</th>
                                        <th>Culls</th>
                                        <th>Feed Consumed (In Grams)</th>
                                        <th>Avg. Bird Weight (In Grams)</th>
                                        <th>FCR</th>
                                        <th>EEF</th>
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
            .tile span {
                font-weight: var(--weight-medium);
                color: var(--text-muted);
                text-transform: uppercase;
                font-size: var(--text-tiny);
                margin-top: var(--margin-xs);
            }

           .card-body {
                justify-content: center;  /* Centers content horizontally */
                align-items: center;      /* Centers content vertically */
                height: 100%;             /* Ensures that the container has a defined height */
            }

            .card-body .activity-heatmap, .card-body .chart-row div {
                display: flex;
                align-items: center;      /* Aligns items vertically inside the heatmap */
                justify-content: center;  /* Optionally centers the content horizontally inside */
                width: 100%;              /* Make sure the heatmap spans the full width */
                height: 100%;             /* Make sure the heatmap spans the full height of the container */
                box-sizing: border-box;   /* Ensures padding/borders don't overflow */
            }
            
            /* Performance Tiles Styling */
            .tile {
                border: 1px solid var(--border-color);
                border-radius: 8px;
                cursor: pointer;
                min-height: 84px;
                padding: var(--number-card-padding);
            }

            .tile-value {
                font-size: var(--text-2xl);
                font-weight: var(--weight-semibold);
                letter-spacing: 0.01em;
                line-height: var(--text-line-height-3xl);
                color: var(--text-color);
                display: flex;
                justify-content: space-between;
                flex-direction: column;
                padding-top: var(--padding-md);
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
                .row {
                    display: flex;
                }
            }
        </style>

        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.5/xlsx.full.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js"></script>

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
                    updatePerformanceTiles(data.performance_metrics);

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
            $('#first-week-mortality').text(`${data.first_week_mortality || 0}`);
            $('#total-mortality').text(`${data.total_mortality || 0}`);
            $('#fcr').text(data.fcr || 0);
            $('#body-weight').text(`${data.body_weight || 0} kg`);
            $('#eef').text(data.eef || 0);
            $('#production-cost').text(`₹${data.production_cost || 0}`);
        }

        // Render Activity Heatmap
        // Render Activity Heatmap using Frappe Charts
        function renderActivityHeatmap(activityData) {
            const heatmapContainer = $('#batch-activity-heatmap');
            heatmapContainer.empty();

            if (activityData && activityData.dataPoints) {
                // Prepare data for Frappe Heatmap
                const chartData = {
                    dataPoints: activityData.dataPoints,
                    start: new Date(activityData.start),
                    end: new Date(activityData.end)
                };

                // Create Frappe Heatmap
                new frappe.Chart(heatmapContainer[0], {
                    type: 'heatmap',
                    width: 960,
                    data: chartData,
                    // Optional customizations
                    discreteDomains: 1,
                    color: 'green',
                    radius: 3,
                    showLegend: 0
                });
            } else {
                heatmapContainer.html('<p>No activity data available</p>');
            }
        }

        // Update Comparative Charts with Fallback
        function updateComparativeCharts(chartsData) {
            // Ensure default values if data is missing
            const defaultChartData = {
                transaction_date: [],
                mortality_std: [],
                mortality_actual: [],
                feed_std: [],
                feed_actual: [],
                fcr_std: [],
                fcr_actual: [],
                weight_std: [],
                weight_actual: []
            };

            // Merge provided data with defaults
            const mergedChartsData = { ...defaultChartData, ...chartsData };

            // Extract dates and values from the new data structure
            const getFormattedData = (dataArray) => {
                if (!dataArray || !Array.isArray(dataArray)) return [];
                return dataArray.map(item => item.value || 0);
            };

            // Format date labels for x-axis - convert YYYY-MM-DD to more readable format
            const formatDateLabels = (dates) => {
                if (!dates || !Array.isArray(dates)) return [];

                return dates.map(dateStr => {
                    const date = new Date(dateStr);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                });
            };

            // Store global data for export (formatted to just values for compatibility)
            window.mortalityStdData = getFormattedData(mergedChartsData.mortality_std);
            window.mortalityActualData = getFormattedData(mergedChartsData.mortality_actual);
            window.feedStdData = getFormattedData(mergedChartsData.feed_std);
            window.feedActualData = getFormattedData(mergedChartsData.feed_actual);
            window.fcrStdData = getFormattedData(mergedChartsData.fcr_std);
            window.fcrActualData = getFormattedData(mergedChartsData.fcr_actual);
            window.weightStdData = getFormattedData(mergedChartsData.weight_std);
            window.weightActualData = getFormattedData(mergedChartsData.weight_actual);

            // Get formatted date labels or use default week labels if no dates
            const dateLabels = mergedChartsData.transaction_date && mergedChartsData.transaction_date.length > 0
                ? formatDateLabels(mergedChartsData.transaction_date)
                : ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];

            const chartConfigs = [
                {
                    id: 'mortality-chart',
                    label: 'Mortality',
                    standardData: getFormattedData(mergedChartsData.mortality_std),
                    actualData: getFormattedData(mergedChartsData.mortality_actual),
                    yAxisLabel: 'Birds'
                },
                {
                    id: 'feed-consumption-chart',
                    label: 'Feed Consumption',
                    standardData: getFormattedData(mergedChartsData.feed_std),
                    actualData: getFormattedData(mergedChartsData.feed_actual),
                    yAxisLabel: 'Grams'
                },
                {
                    id: 'fcr-chart',
                    label: 'Feed Conversion Ratio',
                    standardData: getFormattedData(mergedChartsData.fcr_std),
                    actualData: getFormattedData(mergedChartsData.fcr_actual),
                    yAxisLabel: 'Ratio'
                },
                {
                    id: 'body-weight-chart',
                    label: 'Body Weight',
                    standardData: getFormattedData(mergedChartsData.weight_std),
                    actualData: getFormattedData(mergedChartsData.weight_actual),
                    yAxisLabel: 'Grams'
                }
            ];

            // Destroy existing charts to prevent duplicates
            Chart.helpers.each(Chart.instances, function (instance) {
                instance.destroy();
            });

            chartConfigs.forEach(config => {
                const ctx = document.getElementById(config.id).getContext('2d');
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: dateLabels,
                        datasets: [
                            {
                                label: 'Standard',
                                data: config.standardData,
                                borderColor: 'blue',
                                backgroundColor: 'rgba(0,0,255,0.1)',
                                borderWidth: 2,
                                tension: 0.2 // Add slight curve to the lines
                            },
                            {
                                label: 'Actual',
                                data: config.actualData,
                                borderColor: 'red',
                                backgroundColor: 'rgba(255,0,0,0.1)',
                                borderWidth: 2,
                                tension: 0.2 // Add slight curve to the lines
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: config.label,
                                font: {
                                    size: 16,
                                    weight: 'bold'
                                }
                            },
                            tooltip: {
                                mode: 'index',
                                intersect: false,
                                callbacks: {
                                    label: function (context) {
                                        let label = context.dataset.label || '';
                                        if (label) {
                                            label += ': ';
                                        }
                                        label += parseFloat(context.raw).toFixed(2);
                                        return label;
                                    }
                                }
                            },
                            legend: {
                                position: 'top'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: config.yAxisLabel
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Date'
                                }
                            }
                        },
                        interaction: {
                            intersect: false,
                            mode: 'nearest'
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
						<td>${transaction.total_mortality_qty}</td>
						<td>${transaction.total_cull_qty}</td>
						<td>${transaction.actual_total_feed_consumption} gm</td>
						<td>${transaction.actual_avg_bird_weight} gm</td>
						<td>${transaction.fcr}</td>
						<td>${transaction.eef}</td>
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

    // // Network status indicators
    // $(document).ajaxStart(function () {
    //     console.log('AJAX Request Started');
    //     frappe.show_progress('Loading', 0, 100, 'Please wait...');
    // });

    // $(document).ajaxStop(function () {
    //     console.log('AJAX Request Finished');
    //     setTimeout(function () {
    //         frappe.hide_progress();
    //     }, 500); // delay of 500ms
    // });
});