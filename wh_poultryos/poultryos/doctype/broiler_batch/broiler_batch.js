// Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
// For license information, please see license.txt

frappe.ui.form.on('Broiler Batch', {

    refresh: function (frm) {
        // Fetch the transaction data and process for heatmap
        fetchTransactionData(frm);
        renderKPIs(frm);

        if (frm.doc.live_quantity_number_of_birds === 0) {
            frm.set_value('batch_status', 'Completed');
        }
    },

    onload: function (frm) {
        // Fetch organization name


        frappe.call({
            method: 'wh_poultryos.session_getter.get_org_name_from_session',
            callback: function (r) {
                if (r.message) {
                    frm.set_value('org_name', r.message.org_name);
                }
            }
        });

        // Check token balance if it's a new form
        if (frm.is_new()) {
            checkTokenBalance(frm);
        }
    },

    // refresh: function (frm) {
    //     // Check and update batch status if live_quantity is 0
    //     if (frm.doc.live_quantity_number_of_birds === 0) {
    //         frm.set_value('batch_status', 'Completed');

    //     }
    // },

    module: function (frm) {
        if (frm.doc.module) {
            frm.fields_dict['breed_name'].get_query = function (doc) {
                return {
                    filters: {
                        'module': doc.module
                    }
                };
            };
        } else {
            frm.fields_dict['breed_name'].get_query = null;
            frm.set_value('breed_name', '');
        }
    },

    place_quantity_number_of_birds: function (frm) {
        frm.set_value("live_quantity_number_of_birds", frm.doc.place_quantity_number_of_birds || 0);
    },

    opening_date: function (frm) {
        // if (frm.doc.opening_date) {
        //     // let formatted_date = frappe.datetime.obj_to_user(frm.doc.opening_date);
        //     frm.set_value('live_batch_date', frm.doc.opening_date);
        // }

        // let opening_date = frappe.datetime.obj_to_user(frm.doc.opening_date);
        // let today = frm.doc.live_batch_date;
        // let days_diff = frappe.datetime.get_diff(today, opening_date);
        // frm.set_value("batch_age_in_days", days_diff || 0);

        if (frm.doc.opening_date) {
            // Convert opening date to system format (YYYY-MM-DD)
            let opening_date = frappe.datetime.str_to_obj(frm.doc.opening_date);
            frm.set_value('live_batch_date', frm.doc.opening_date);

            let today = frappe.datetime.str_to_obj(frm.doc.live_batch_date);

            // Calculate difference in days
            let days_diff = frappe.datetime.get_diff(today, opening_date);
            frm.set_value("batch_age_in_days", days_diff || 0);
        }

    },

    rate: function (frm) {
        frm.set_value('amount', frm.doc.place_quantity_number_of_birds * frm.doc.rate);
        frm.set_value('biological_value', frm.doc.place_quantity_number_of_birds * frm.doc.rate);
        frm.set_value('bird_cost', frm.doc.rate);
    },

    before_save: function (frm) {
        if (frm.is_new()) {
            console.log("New Broiler Batch Detected in before_save");
            return new Promise((resolve, reject) => {
                checkTokenBalance(frm, resolve, reject);
            });
        } else {
            console.log("Existing Broiler Batch Modified: No Count Change Needed");
        }
    },

    after_save: function (frm) {
        if (!validateMandatoryFields(frm)) {
            return;
        }
        frappe.set_route("List", "Broiler Batch");
    }
});

function validateMandatoryFields(frm) {
    let missingFields = [];
    frm.meta.fields.forEach(field => {
        if (field.reqd && !frm.doc[field.fieldname]) {
            missingFields.push(field.label);
        }
    });

    if (missingFields.length > 0) {
        frappe.msgprint({
            title: __("Missing Mandatory Fields"),
            message: __("Please fill in the following fields:") + "<br><b>" + missingFields.join(", ") + "</b>",
            indicator: "red",
        });
        return false;
    }
    return true;
}

function checkTokenBalance(frm, resolve, reject) {
    const user_id = frappe.session.user;

    // Fetch Broiler Batch cost from Batch Settings
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'Batch Settings',
            fieldname: 'broiler_batch_cost'
        },
        callback: function (r) {
            const broiler_batch_cost = r.message.broiler_batch_cost;

            // Fetch user's token balance
            frappe.call({
                method: 'frappe.client.get_value',
                args: {
                    doctype: 'User Balance',
                    filters: { 'user': user_id },
                    fieldname: 'available_balance'
                },
                callback: function (r) {
                    const user_balance = r.message?.available_balance || 0;

                    if (user_balance < 1) {
                        // Show payment dialog if insufficient balance
                        showPaymentDialog(broiler_batch_cost, 1, frm, resolve, reject);
                        if (reject) reject(new Error('Insufficient tokens'));
                    } else if (resolve) {
                        resolve();
                    }
                }
            });
        }
    });
}

function showPaymentDialog(amount_needed, batch_count, frm, resolve, reject) {
    const dialog = new frappe.ui.Dialog({
        title: 'Insufficient Tokens',
        fields: [
            {
                fieldtype: 'HTML',
                fieldname: 'message_html',
                options: `<p>You need <strong>atleast 1</strong> token to create a new Broiler Batch.</p>`
            },
            {
                label: 'Amount Needed',
                fieldname: 'amount',
                fieldtype: 'Currency',
                default: amount_needed,
                read_only: 1
            },
            {
                label: 'Proceed to Payment',
                fieldtype: 'Button',
                click: function () {
                    dialog.hide();
                    redirectToPayment(amount_needed, batch_count, frm);
                }
            }
        ],
        onhide: function () {
            if (reject) reject(new Error('Payment dialog closed'));
        }
    });

    dialog.show();
}

function redirectToPayment(total_amount, batch_count, frm) {
    const cashfree = window.Cashfree({
        mode: "sandbox",
    });
    const base_url = window.location.origin;

    frappe.call({
        method: 'wh_poultryos.payment_controller.create_payment_order',
        args: {
            amount_needed: total_amount,
            batch_count: batch_count,
            is_new: 1
        },
        callback: function (response) {
            let checkoutOptions = {
                paymentSessionId: response.message.payment_session_id,
                redirectTarget: "_self",
                returnUrl: base_url + "/app/broiler-batch/new-broiler-batch",
            };

            cashfree.checkout(checkoutOptions).then(function (result) {
                if (result.error) {
                    alert(result.error.message);
                    if (frm.reject) frm.reject(new Error('Payment failed'));
                }
                if (result.redirect) {
                    console.log("Redirection");
                }
            });
        }
    });
}



// Function to fetch transaction data and render heatmap
function fetchTransactionData(frm) {
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Broiler Daily Transaction",
            filters: { "batch": frm.doc.name },
            fields: ["transaction_date", "name"]
        },
        callback: function (r) {
            if (r.message) {
                const dataPoints = processTransactionData(r.message, frm.doc.opening_date);
                renderHeatmap(frm, dataPoints);
            }
        }
    });
}


function processTransactionData(transactions, openingDate) {
    let dataPoints = {};

    // Ensure start date is set to January 1st of the current year
    let currentYear = new Date().getFullYear();
    let startDate = new Date(currentYear, 0, 1);  // January 1st
    let endDate = new Date(currentYear, 11, 31); // December 31st

    // Convert transaction data to heatmap-friendly format
    transactions.forEach(function (transaction) {
        let date = transaction.transaction_date;

        // Initialize if not exists
        if (!dataPoints[date]) {
            dataPoints[date] = 0;
        }

        // Increment count for this date
        dataPoints[date]++;
    });

    return { dataPoints, startDate, endDate };
}

// Function to render the heatmap chart
function renderHeatmap(frm, { dataPoints, startDate, endDate }) {
    const heatmapContainer = frm.fields_dict['broiler_batch_daily_transactions_heatmap'].wrapper;

    if (heatmapContainer) {
        // Apply full-width styles to container
        $(heatmapContainer).css({
            "width": "100%",
            "display": "flex",
            "justify-content": "center"
        });

        // Clear any existing heatmap
        $(heatmapContainer).empty();

        // Render the heatmap
        new frappe.Chart(heatmapContainer, {
            type: 'heatmap',
            width: "100%",  // Use full width
            height: 180,    // Adjust height
            data: {
                dataPoints: dataPoints,
                start: startDate,
                end: endDate
            },
            countLabel: 'Daily Transactions',
            discreteDomains: 1,
            showLegend: 0
        });
    } else {
        console.error("Heatmap container not found");
    }
}

// Function to render the KPI chart
function renderKPIs(frm) {
    const KPIContainer = frm.fields_dict['broiler_batch_kpis'].wrapper;

    // Ensure KPI container is available
    if (KPIContainer && frm.fields_dict.broiler_batch_kpis.$wrapper) {
        // Apply styles to center the chart
        $(KPIContainer).css({
            "width": "100%",
            "display": "block",
            "justify-content": "center"
        });

        // Clear any existing KPI
        frm.fields_dict.broiler_batch_kpis.$wrapper.empty();

        // Add CSS styles
        const kpiStyles = `
            <style>
                /* KPI dashboard styles */
                .kpi-dashboard {
                    width: 100%;
                    margin-bottom: 10px;
                    border-collapse: collapse;
                    flex-wrap: wrap; /* Allows wrapping when there's not enough space */
                    justify-content: space-between; /* Ensures even spacing between cards */
                }

                .kpi-dashboard td {
                    width: 25%; /* Force 4 columns */
                    padding: 5px;
                    vertical-align: top;
                    box-sizing: border-box; /* Ensure padding and border are included in width */
                }

                .kpi-card {
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    cursor: pointer;
                    min-height: 84px;
                    padding: var(--number-card-padding);
                }

                .kpi-card h3 {
                    font-weight: var(--weight-medium);
                    color: var(--text-muted);
                    text-transform: uppercase;
                    font-size: var(--text-tiny);
                    margin-top: var(--margin-xs);
                }

                .kpi-value {
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

                .kpi-subtitle {
                    font-size: 10px;
                    color: #777;
                }

                /* Color indicators */
                .mortality { color: #e74c3c; }
                .culls { color: #f39c12; }
                .sales { color: #27ae60; }
                .profit { color: #3498db; }
                .loss { color: #e74c3c; }
                .feed { color: #3498db; }

                /* Negative value indicator */
                .negative-amount:before {
                    content: "-";
                }

            </style>
        `;

        // Get batch data from the form
        const batchData = {
            place_quantity: frm.doc.place_quantity_number_of_birds || 0,
            mortality: frm.doc.mortality || 0,
            culls: frm.doc.culls || 0,
            sale_quantity: frm.doc.sale_quantity || 0,
            total_feed: frm.doc.total_feed || 0,
            batch_age_in_days: frm.doc.batch_age_in_days || 1,
            rate: frm.doc.rate || 0,
            bird_cost: frm.doc.bird_cost || 0,
            avg_weight: frm.doc.body_weight || 0
        };

        // Add KPI HTML (with included CSS) to the container
        $(frm.fields_dict.broiler_batch_kpis.$wrapper.get(0)).html(`
            ${kpiStyles}
            <div id='kpi-container'>
                <table class="kpi-dashboard">
                    <tr>
                        <td>
                            <div class="kpi-card">
                                <h3>Mortality Rate</h3>
                                <div class="kpi-value mortality" id="mortality-rate">${calculateMortalityRate(batchData)}%</div>
                                <div class="kpi-subtitle" id="mortality-count">${Math.round(batchData.mortality)} birds</div>
                            </div>
                        </td>
                        <td>
                            <div class="kpi-card">
                                <h3>Cull Rate</h3>
                                <div class="kpi-value culls" id="cull-rate">${calculateCullRate(batchData)}%</div>
                                <div class="kpi-subtitle" id="cull-count">${Math.round(batchData.culls)} birds</div>
                            </div>
                        </td>
                        <td>
                            <div class="kpi-card">
                                <h3>Sale-to-Bird Ratio</h3>
                                <div class="kpi-value sales" id="sale-ratio">${calculateSaleRatio(batchData)}%</div>
                                <div class="kpi-subtitle" id="sale-count">${Math.round(batchData.sale_quantity)} birds sold</div>
                            </div>
                        </td>
                        <td>
                            <div class="kpi-card">
                                <h3>Total Feed</h3>
                                <div class="kpi-value feed" id="total-feed">${Math.round(batchData.total_feed)} kg</div>
                                <div class="kpi-subtitle" id="feed-per-bird">Per Bird: ${calculateFeedPerBird(batchData)} kg</div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="kpi-card">
                                <h3>Feed Conversion Ratio</h3>
                                <div class="kpi-value" id="fcr">${calculateFCR(batchData)}</div>
                                <div class="kpi-subtitle">kg feed per kg meat</div>
                            </div>
                        </td>
                        <td>
                            <div class="kpi-card">
                                <h3>Daily Growth Rate</h3>
                                <div class="kpi-value" id="daily-growth">${calculateDailyGrowth(batchData)} g</div>
                                <div class="kpi-subtitle">Average daily weight gain</div>
                            </div>
                        </td>
                        <td>
                            <div class="kpi-card">
                                <h3 id="profit-loss-title">${calculateProfit(batchData) >= 0 ? 'Profit Margin' : 'Loss Margin'}</h3>
                                <div class="kpi-value ${calculateProfit(batchData) >= 0 ? 'profit' : 'loss negative-amount'}" id="profit-loss-value">₹${formatCurrency(Math.abs(calculateProfit(batchData)))}</div>
                                <div class="kpi-subtitle">Return on Investment</div>
                            </div>
                        </td>
                        <td>
                            <div class="kpi-card">
                                <h3>ROI Percentage</h3>
                                <div class="kpi-value ${calculateROIPercent(batchData) >= 0 ? 'profit' : 'loss negative-amount'}" id="roi-percent">${formatNumber(Math.abs(calculateROIPercent(batchData)))}%</div>
                                <div class="kpi-subtitle">Return on Investment %</div>
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
        `);
    } else {
        console.error("HTML field not found or not fully rendered");
    }
}

// Calculate Mortality Rate
function calculateMortalityRate(data) {
    if (data.place_quantity <= 0) return "0.00";
    return ((data.mortality / data.place_quantity) * 100).toFixed(2);
}

// Calculate Cull Rate
function calculateCullRate(data) {
    if (data.place_quantity <= 0) return "0.00";
    return ((data.culls / data.place_quantity) * 100).toFixed(2);
}

// Calculate Sale-to-Bird Ratio
function calculateSaleRatio(data) {
    if (data.place_quantity <= 0) return "0.00";
    return ((data.sale_quantity / data.place_quantity) * 100).toFixed(2);
}

// Calculate Feed Per Bird
function calculateFeedPerBird(data) {
    if (data.place_quantity <= 0) return "0.00";
    return (data.total_feed / data.place_quantity).toFixed(2);
}

// Calculate Feed Conversion Ratio (FCR)
function calculateFCR(data) {
    if (data.sale_quantity <= 0 || data.avg_weight <= 0) return "0.00";
    return (data.total_feed / (data.sale_quantity * data.avg_weight)).toFixed(3);
}

// Calculate Daily Growth Rate
function calculateDailyGrowth(data) {
    if (data.batch_age_in_days <= 0) return "0.00";
    const dailyGrowth = (data.avg_weight / data.batch_age_in_days);
    return dailyGrowth.toFixed(2);
}

// Calculate Profit/Loss
function calculateProfit(data) {
    const salesIncome = data.sale_quantity * data.rate;
    const investment = data.bird_cost * data.place_quantity;
    return salesIncome - investment;
}

// Calculate ROI Percentage
function calculateROIPercent(data) {
    const investment = data.bird_cost * data.place_quantity;
    if (investment <= 0) return 0;
    const profit = calculateProfit(data);
    return (profit / investment * 100).toFixed(2);
}

// Format currency values
function formatCurrency(value) {
    return parseFloat(value).toFixed(2);
}

// Format numbers
function formatNumber(value) {
    return parseFloat(value).toFixed(2);
}
