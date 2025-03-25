// apps/wh_poultryos/wh_poultryos/poultryos/doctype/broiler_daily_transaction/broiler_daily_transaction.js
// Client script for Broiler Daily Transaction
frappe.ui.form.on('Broiler Daily Transaction', {

    onload: function (frm) {

        // Set a query filter for the Batch dropdown
        frm.set_query('batch', function () {
            return {
                filters: {
                    batch_status: ['not in', ['Completed']]
                }
            };
        });

        // Apply filter to Item Name based on Consumption Type using set_query
        frm.set_query('consumption_item', 'consumption_details', function (doc, cdt, cdn) {
            let row = locals[cdt][cdn]; // Fetch row inside the function
            console.log("Applying Filter for Item Type:", row.consumption_type); // Debugging

            return {
                filters: {
                    item_type: row.consumption_type // Filter items based on selected type
                }
            };
        });

    },

    refresh: function (frm) {
        // Add custom buttons
        setupCustomButtons(frm);

        // Set conditional display rules
        if (frm.doc.mortality_variance > 0) {
            frm.dashboard.add_indicator(__('High Mortality'), 'orange');
        }

        if (frm.doc.feed_consumption_variance_percentage > 5) {
            frm.dashboard.add_indicator(__('High Feed Variance'), 'red');
        }


    },

    batch: function (frm) {
        if (frm.doc.batch) {
            frm.enable_save();
            fetchBatchDetails(frm);
        }
    },

    transaction_date: function (frm) {
        // If batch and transaction date are set, update batch age
        if (frm.doc.batch && frm.doc.transaction_date) {
            updateBatchAge(frm);
        }
    },

    // Calculate consumption cost automatically
    validate: function (frm) {

        // Check for missing critical values
        validateRequiredFields(frm);

        frappe.call({
            method: "wh_poultryos.poultryos.doctype.broiler_daily_transaction.broiler_daily_transaction.check_daily_transaction",
            args: {
                batch: frm.doc.batch,
                transaction_date: frm.doc.transaction_date
            },
            async: false, // Ensure validation waits for response
            callback: function (response) {
                if (response.message.exists) {
                    frappe.msgprint({
                        title: __('Warning'),
                        indicator: 'red',
                        message: __('Daily transaction already exists for this batch on the given date.')
                    });
                    frappe.validated = false; // Prevent saving
                }
            }
        });

    },

    // before_save: async function(frm)
    // {
    //     updateBatchAge(frm);
    // },

    after_save: async function (frm) {

        frappe.call({
            method: 'wh_poultryos.poultryos.doctype.broiler_daily_transaction.broiler_daily_transaction.get_first_week_mortality',
            args: {
                batch_name: frm.doc.batch
            },
            callback: function (r) {
                if (r.message) {
                    let mor = r.message;
                    console.log(mor);
                    frappe.call({
                        method: 'wh_poultryos.poultryos.doctype.broiler_daily_transaction.broiler_daily_transaction.update_first_week_mortality',
                        args: {
                            batch_name: frm.doc.batch,
                            mortality_value: mor
                        },
                        callback: function () {
                            console.log(__('First week mortality updated successfully.'));
                            frappe.call({
                                method: 'wh_poultryos.poultryos.doctype.broiler_daily_transaction.broiler_daily_transaction.update_batch_status',
                                args: {
                                    batch: frm.doc.batch  // Ensure 'batch' exists in the document
                                },
                                callback: function (r) {
                                    if (r.message.status === "success") {

                                    } else {

                                    }
                                }
                            });
                        }
                    });
                }
            }
        });

        if (frm.doc.transaction_date) {
            frappe.call({
                method: 'frappe.client.get',
                args: {
                    doctype: 'Broiler Batch',
                    name: frm.doc.batch // Use the batch identifier from the form
                },
                callback: function (r) {
                    if (r.message) { // ✅ Ensure batch data is available
                        let batch_data = r.message;

                        let batch_placed_quantity = batch_data.place_quantity_number_of_birds || 0;
                        let biological_value = batch_data.biological_value || 0; // Previous Biological Value       
                        let salequantity = batch_data.sale_quantity || 0;
                        let feed_cost = frm.doc.feed_cost || 0; // Feed Cost from the form
                        let mortality_cost = frm.doc.mortality_cost || 0; // Mortality Cost from the form

                        // ✅ Calculate Updated Values
                        // let updated_biological_value = biological_value + feed_cost - mortality_cost;
                        let updated_biological_value = parseFloat((biological_value + feed_cost - mortality_cost).toFixed(3));
                        let updated_batch_live_quantity = frm.doc.batch_live_qty - (frm.doc.total_mortality_qty || 0) - (frm.doc.total_cull_qty || 0) - salequantity;

                        // ✅ Calculate Bird Cost
                        let bird_cost = 0;
                        if (updated_batch_live_quantity > 0) {
                            bird_cost = parseFloat((updated_biological_value / updated_batch_live_quantity).toFixed(4));
                        }

                        // ✅ Update Batch Values in Frappe
                        frappe.call({
                            method: 'frappe.client.set_value',
                            args: {
                                doctype: 'Broiler Batch',
                                name: frm.doc.batch,
                                fieldname: {
                                    biological_value: updated_biological_value,
                                    bird_cost: bird_cost
                                },
                                ignore_version: 1 // ✅ Prevents document update conflict
                            },
                            callback: function () {
                                frappe.msgprint(__('Batch updated successfully.'));
                            }
                        });

                    } else {
                        console.error("❌ Failed to fetch batch data.");
                    }
                }
            });
        }

        let batch_age_in_days = frm.doc.batch_age;
        let average_bird_weight_in_kg = frm.doc.actual_avg_bird_weight;
        let average_bird_weight_in_kg2 = (frm.doc.actual_avg_bird_weight / 1000);

        // Only proceed if conditions are met
        if (batch_age_in_days >= 15 || average_bird_weight_in_kg2 >= 1.5) {
            try {
                // Check if the settings are available
                await checkBroilerBirdSaleSettings();

                // Fetch the Broiler Bird Sale Settings
                let settings = await fetchBroilerBirdSaleSettings();
                let enable_ideal_age_for_selling_birds = settings.enable_ideal_age_for_selling_birds;
                let enable_ideal_average_weight_for_selling_birds = settings.enable_ideal_average_weight_for_selling_birds;
                let ideal_age_for_selling_birds = settings.ideal_age_for_selling_birds;
                let ideal_weight_for_selling_birds = settings.ideal_weight_for_selling_birds;

                // Check for ideal age for selling birds
                if (enable_ideal_age_for_selling_birds && batch_age_in_days >= ideal_age_for_selling_birds) {
                    await updateBatchStatus(frm, 'Ready for Sale');
                }

                // Check for ideal average weight for selling birds
                if (enable_ideal_average_weight_for_selling_birds && average_bird_weight_in_kg >= ideal_weight_for_selling_birds) {
                    await updateBatchStatus(frm, 'Ready for Sale');
                }

            } catch (error) {
                console.error(error);
            }
        }


    }


});





async function checkBroilerBirdSaleSettings() {
    return new Promise((resolve, reject) => {
        frappe.call({
            method: 'frappe.client.get_count',
            args: { doctype: 'Broiler Bird Sale Settings' },
            callback: function (response) {
                if (response.message === 0) {
                    showSettingsNotification();
                    reject("No Broiler Bird Sale Settings found");
                } else {
                    resolve();
                }
            }
        });
    });
}

function showSettingsNotification() {
    frappe.msgprint({
        message: __('Please enable Ideal Age and/or Ideal Average Weight for Selling Birds from Broiler Bird Sale Settings.') +
            '<br><br>' +
            __('Click here to create a new record.') + ': ' +
            '<a href="#" onclick="frappe.new_doc(\'Broiler Bird Sale Settings\')">' + __('Create New Record') + '</a>',
        title: __('Configuration Needed'),
        indicator: 'orange'
    });
}

async function fetchBroilerBirdSaleSettings() {
    return new Promise((resolve, reject) => {
        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'Broiler Bird Sale Settings',
                fields: ['enable_ideal_age_for_selling_birds', 'enable_ideal_average_weight_for_selling_birds', 'ideal_age_for_selling_birds', 'ideal_weight_for_selling_birds'],
                limit_page_length: 1
            },
            callback: function (result) {
                if (result.message && result.message.length > 0) {
                    resolve(result.message[0]);
                } else {
                    reject("No settings found");
                }
            }
        });
    });
}

async function updateBatchStatus(frm, status) {
    return new Promise((resolve, reject) => {
        frappe.call({
            method: 'wh_poultryos.poultryos.doctype.broiler_batch.broiler_batch.update_batch_status',
            args: {
                batch_name: frm.doc.batch,
                status: status
            },
            callback: function (r) {
                if (r.message.status === "success") {
                    frappe.msgprint(__('This Batch has been ready for sale.'));
                    resolve();
                } else {
                    reject("Failed to update batch status");
                }
            }
        });
    });
}

// Client script for Broiler Consumption Detail
frappe.ui.form.on('Broiler Mortality Detail', {

    qty: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        if (row.idx) {
            frappe.db.get_value("Broiler Batch", { "name": frm.doc.batch }, "bird_cost")
                .then(r => {
                    if (r.message && r.message.bird_cost) {
                        let bird_cost = parseFloat(r.message.bird_cost).toFixed(3); // Round to 3 decimal places
                        let cost = (row.qty * bird_cost).toFixed(3);
                        frappe.model.set_value(cdt, cdn, "cost", cost);

                        // Update total cost in parent doctype
                        update_total_cost(frm);
                    }
                });
        }
    }

});

// Function to calculate total cost
function update_total_cost(frm) {
    let total_cost = 0;

    (frm.doc.mortality_details || []).forEach(row => {
        total_cost += parseFloat(row.cost || 0);
    });

    frm.set_value("mortality_cost", total_cost.toFixed(3)); // Save rounded total in parent doctype
}

// Client script for Broiler Consumption Detail
frappe.ui.form.on('Broiler Consumption Detail', {
    consumption_qty: function (frm, cdt, cdn) {
        calculateConsumptionCost(frm, cdt, cdn);
    },

    consumption_rate: function (frm, cdt, cdn) {
        calculateConsumptionCost(frm, cdt, cdn);
    },


    consumption_type: function (frm, cdt, cdn) {
        // Reset values when type changes
        var row = locals[cdt][cdn];

        if (row.consumption_type) {

            row.consumption_qty = 0;
            row.consumption_rate = 0;
            row.consumption_cost = 0;

            frm.refresh_field('consumption_details');
        }
    },

    consumption_item: function (frm, cdt, cdn) {
        var row = locals[cdt][cdn];

        // Check if the same consumption_item already exists in the table
        var existing_entry = frm.doc.consumption_details.some(item => item.consumption_item === row.consumption_item && item.name !== row.name);

        if (existing_entry) {
            frappe.msgprint(__('You have already entered feed consumption for this item.'));
            frappe.model.set_value(cdt, cdn, 'consumption_item', '');
            return;
        }
    }


});

function scrapBatch(frm) {
    frappe.call({
        method: 'wh_poultryos.poultryos.doctype.broiler_daily_transaction.broiler_daily_transaction.scrap_batch',
        args: {
            batch_name: frm.doc.batch
        },
        callback: function (r) {
            if (r.message === 'success') {
                frappe.msgprint(__('Batch successfully scrapped.'));
                frm.reload_doc(); // Refresh form after update
                frm.disable_save();
            } else {
                frappe.msgprint(__('Error: ' + r.message));
            }
        }
    });
}

function setupCustomButtons(frm) {


    frm.add_custom_button(__('Scrap the Batch'), function () {

        if (!frm.doc.batch) {
            frappe.msgprint(__('Please select a batch before scrapping.'));
            return;
        }

        frappe.confirm(
            'Are you sure you want to scrap this batch?',
            function () {
                scrapBatch(frm);
            }
        );
    });

    // Add a custom button to fetch standard values based on breed and age
    frm.add_custom_button(__('Load Standard Values'), function () {
        if (!frm.doc.batch) {
            frappe.msgprint(__('Batch and batch age are required to load standard values'));
            return;
        }

        frappe.call({
            method: 'wh_poultryos.api.get_standard_values',
            args: {
                'batch': frm.doc.batch,
                'age': frm.doc.batch_age,
                'module': "CBF"
            },
            freeze: true,
            freeze_message: __('Loading standard values...'),
            callback: function (r) {
                if (r.message) {
                    frm.set_value('standard_mortality', r.message.mortality);
                    frm.set_value('standard_culls', r.message.culls);
                    frm.set_value('standard_avg_bird_weight', r.message.avg_weight);
                    frm.set_value('standard_total_feed_consumption', r.message.feed_consumption);
                    frappe.show_alert({
                        message: __('Standard values loaded'),
                        indicator: 'green'
                    });
                } else {
                    frappe.show_alert({
                        message: __('Failed to load standard values'),
                        indicator: 'red'
                    });
                }
            }
        });
    });

    // Add a custom button to update batch statistics
    frm.add_custom_button(__('Update Batch Statistics'), function () {
        if (!frm.doc.batch) {
            frappe.msgprint(__('Batch is required to update statistics'));
            return;
        }

        frappe.call({
            method: 'wh_poultryos.api.update_batch_stats',
            args: {
                'batch': frm.doc.batch,
                "transaction_datee": frm.doc.transaction_date
            },
            freeze: true,
            freeze_message: __('Updating batch statistics...'),
            callback: function (r) {
                if (r.message && r.message.success) {
                    // Update form values from response
                    frm.set_value('fcr', r.message.data.fcr);
                    frm.set_value('eef', r.message.data.eef);
                    frm.set_value('production_cost', r.message.data.production_cost);
                    frm.set_value('batch_live_qty', r.message.data.live_quantity);
                    frm.reload_doc();
                    frappe.show_alert({
                        message: __('Batch statistics updated successfully'),
                        indicator: 'green'
                    });
                } else {
                    frappe.show_alert({
                        message: __('Failed to update batch statistics: {0}',
                            [r.message ? r.message.message : 'Unknown error']),
                        indicator: 'red'
                    });
                }
            }
        });

    }, __('Actions'));
}




function fetchBatchDetails(frm) {
    frappe.call({
        method: 'frappe.client.get',
        args: {
            doctype: 'Broiler Batch',
            name: frm.doc.batch
        },
        callback: function (r) {
            if (r.message) {
                frm.set_value('batch_age', r.message.batch_age_in_days);
                frm.set_value('batch_live_qty', r.message.live_quantity_number_of_birds);
                frm.set_value('fcr', r.message.current_fcr);
                frm.set_value('eef', r.message.current_eef);
                frm.set_value('production_cost', r.message.production_cost);

                // If transaction date is already set, update batch age
                if (frm.doc.transaction_date) {
                    updateBatchAge(frm);
                }
            }
        }
    });
}

function updateBatchAge(frm) {

    frappe.call({
        method: 'frappe.client.get',
        args: {
            doctype: 'Broiler Batch',
            name: frm.doc.batch,
            fields: ['opening_date']
        },
        callback: function (r) {
            if (r.message && r.message.opening_date) {
                // Calculate age as days between opening date and transaction date
                var openingDate = frappe.datetime.str_to_obj(r.message.opening_date);
                var transactionDate = frappe.datetime.str_to_obj(frm.doc.transaction_date);
                var diffDays = frappe.datetime.get_diff(transactionDate, openingDate);

                // Set batch age
                frm.set_value('batch_age', diffDays);
                frm.refresh_field('batch_age');
            }
        }
    });
}

// function updateBatchAge(frm) {
//     frappe.call({
//         method: 'frappe.client.get',
//         args: {
//             doctype: 'Broiler Batch',
//             name: frm.doc.batch,
//             fields: ['opening_date']
//         },
//         callback: function (r) {
//             if (r.message && r.message.opening_date) {
//                 // Convert and set time to 00:00:00 to avoid day shift
//                 // Get and standardize both dates
//                 let placementDate = new Date(r.message.opening_date);
//                 let transactionDate = new Date(frm.doc.transaction_date);

//                 // // Reset time to 00:00:00 to avoid time-based discrepancies
//                 // placementDate.setHours(0, 0, 0, 0);
//                 // transactionDate.setHours(0, 0, 0, 0);

//                 // console.log("Standardized Placement Date:", placementDate);
//                 // console.log("Standardized Transaction Date:", transactionDate);

//                 // if (placementDate && transactionDate) {
//                 //     // Calculate difference in days
//                 //     let days_diff = frappe.datetime.get_diff(transactionDate, placementDate);
//                 //     console.log("Age in days:", days_diff);

//                 //     // Optionally set the value in a field
//                 //     frm.set_value('batch_age', days_diff);
//                 //     // Remember to refresh if you're setting a value
//                 //     frm.refresh_field('batch_age');
//                 // } else {
//                 //     console.log("Error: Invalid date format");
//                 // }

//                 // Reset time to 00:00:00 to remove any time discrepancies
//                 placementDate.setHours(0, 0, 0, 0);
//                 transactionDate.setHours(0, 0, 0, 0);

//                 // Force date format to YYYY-MM-DD to avoid time zone issues
//                 let placementDateStr = placementDate.toISOString().split('T')[0];
//                 let transactionDateStr = transactionDate.toISOString().split('T')[0];

//                 console.log("Placement Date (ISO):", placementDateStr);
//                 console.log("Transaction Date (ISO):", transactionDateStr);

//                 // Use frappe.datetime.get_diff for consistent results
//                 let days_diff = frappe.datetime.get_diff(transactionDateStr, placementDateStr);
//                 console.log("Age in days:", days_diff);

//                 // Set batch age only if diff is 0 or more (avoid negative values)
//                 frm.set_value('batch_age', days_diff >= 0 ? days_diff : 0);
//                 frm.refresh_field('batch_age');
//             }
//         }
//     });
// }


function calculateConsumptionCost(frm, cdt, cdn) {
    var row = locals[cdt][cdn];

    // Ensure quantity and rate are not undefined
    var qty = row.consumption_qty || 0;

    // Fetch feed_rate from Broiler Batch
    frappe.db.get_value("Broiler Batch", { "name": frm.doc.batch }, "feed_rate")
        .then(r => {
            if (r.message && r.message.feed_rate) {
                var rate = r.message.feed_rate || 0;
                let cost = qty * rate;

                // Set consumption_cost for the current row
                frappe.model.set_value(cdt, cdn, "consumption_cost", cost);


                // Update feed consumption total when feed type is modified
                if (row.consumption_type === 'Feed') {
                    updateTotalFeedConsumption(frm);
                }

                frm.refresh_field('consumption_details');
            }
        });
}


function calculateAllConsumptionCosts(frm) {

    let total_feed_cost = 0;

    frappe.db.get_value("Broiler Batch", { "name": frm.doc.batch }, "feed_rate")
        .then(r => {
            if (r.message && r.message.feed_rate) {
                var rate = r.message.feed_rate || 0;

                // Process each row in consumption details
                $.each(frm.doc.consumption_details || [], function (i, d) {
                    d.consumption_cost = (d.consumption_qty || 0) * (rate || 0);

                    // Sum feed cost only if consumption_type is 'Feed'
                    if (d.consumption_type === 'Feed') {
                        total_feed_cost += d.consumption_cost || 0;
                    }
                });

                // Set total feed cost in parent doctype
                frm.set_value("feed_cost", total_feed_cost);
                frm.refresh_field("feed_cost");

                // Re-render the grid
                frm.refresh_field('consumption_details');

            }
        });
}


function updateTotalFeedConsumption(frm) {
    var totalFeed = 0;

    // Sum all feed consumption quantities
    $.each(frm.doc.consumption_details || [], function (i, d) {
        if (d.consumption_type === 'Feed') {
            totalFeed += (d.consumption_qty || 0);
        }
    });

    // Update actual total feed consumption
    frm.set_value('actual_total_feed_consumption', totalFeed);
    calculateAllConsumptionCosts(frm);
}

function validateRequiredFields(frm) {
    var warnings = [];

    // Check for critical missing values
    if (!frm.doc.actual_avg_bird_weight) {
        warnings.push(__('Average Bird Weight is missing'));
    }

    if (frm.doc.consumption_details.length === 0) {
        warnings.push(__('No consumption details have been added'));
    }

    let current_date = frappe.datetime.get_today();

    // Transaction Date must be >= Batch Placed On
    if (frm.doc.transaction_date < frm.doc.placement_date) {
        warnings.push(__('Transaction Date must be greater than or equal to Batch Placed On'));
    }

    // Transaction Date can't be in the future
    if (frm.doc.transaction_date > current_date) {
        warnings.push(__('Transaction Date cannot be in the Future'));
    }

    // Display warnings if any
    if (warnings.length > 0) {
        frappe.msgprint({
            title: __('Warning'),
            indicator: 'yellow',
            message: warnings.join('<br><br>') // Adds extra space between messages
        });

        frappe.validated = false;
    }
}


