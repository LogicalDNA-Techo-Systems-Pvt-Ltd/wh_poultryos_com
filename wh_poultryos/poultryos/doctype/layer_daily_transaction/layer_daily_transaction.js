// Copyright (c) 2024, LogicalDNA Techno Systems Pvt Ltd and contributors
// For license information, please see license.txt

frappe.ui.form.on('Layer Daily Transaction', {

    onload: function (frm)
    {
        // Set a query filter for the Batch dropdown
        frm.set_query('batch', function () {
            return {
                filters: {
                    batch_status: ['not in', ['Completed']]
                }
            };
        });
    },

    refresh: function (frm) {
        // Add custom buttons
        setupCustomButtons(frm);
    },

    validate: function (frm) {

        // Ensure the Transaction Date is not in the future when validating
        let transaction_date = frm.doc.transaction_date;
        let batch_placed_on = frm.doc.batch_placed_on;
        let mortality_number_of_birds = frm.doc.mortality_number_of_birds;
        let feed_consumed_quantity = frm.doc.feed_consumed_quantity;
        let batch_live_quantity = frm.doc.batch_live_quantity;

        let current_date = frappe.datetime.get_today();

        // Transaction Date can't be in the future
        if (transaction_date > current_date) {
            frappe.msgprint(__('Transaction Date cannot be in the future'));
            frappe.validated = false;
            return;
        }

        // Transaction Date must be >= Batch Placed On
        if (transaction_date < batch_placed_on) {
            frappe.msgprint(__('Transaction Date must be greater than or equal to Batch Placed On'));
            frappe.validated = false;  // Prevent form submission
            return;
        }


        if (mortality_number_of_birds > batch_live_quantity) {
            frappe.msgprint(__('Mortality (Number of birds) cannot be greater than live quantity'));
            frappe.validated = false;  // Prevent form submission
            return;
        }

        // Feed Consumed Quantity Validation
        if (feed_consumed_quantity <= 0) {
            frappe.msgprint(__('Feed (Consumed Quantity) must be greater than 0'));
            frappe.validated = false;  // Prevent form submission
            return;
        }

    },

    transaction_date: function (frm) {
        // If both batch and transaction date are set, update batch age
        if (frm.doc.batch && frm.doc.transaction_date) {
            updateBatchAge(frm);
        }
    },

    batch: function (frm) {

        if (frm.doc.batch) {
            frm.enable_save();
            fetchBatchDetails(frm);
        }
    },

     // Calculate consumption cost automatically
     validate: function (frm) {

        // calculateAllConsumptionCosts(frm);

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

    after_save: function (frm) {

    }

});

function validateRequiredFields(frm) {
    var warnings = [];

    // Check for critical missing values
    if (!frm.doc.actual_average_bird_weight_in_grams) {
        warnings.push(__('Average Bird Weight is missing'));
    }

    if (frm.doc.layer_consumption.length === 0) {
        warnings.push(__('No consumption details have been added'));
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

function fetchBatchDetails(frm) {
    frappe.call({
        method: 'frappe.client.get',
        args: {
            doctype: 'Layer Batch',
            name: frm.doc.batch
        },
        callback: function (r) {
            if (r.message) {
                frm.set_value('batch_age_in_days', r.message.batch_age_in_days);
                frm.set_value('batch_live_quantity', r.message.live_quantity_number_of_birds);
                frm.set_value('production_cost', r.message.production_cost);
                frm.set_value('batch_placed_on', r.message.opening_date);
                frm.set_value('batch_placed_quantity', r.message.place_quantity_number_of_birds);
              

                // If transaction date is already set, update batch age
                if (frm.doc.transaction_date) {
                    updateBatchAge(frm);
                }
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

        if (!frm.doc.batch || frm.doc.batch_age_in_days === undefined || frm.doc.batch_age_in_days === null || frm.doc.batch_age_in_days === '') {
            frappe.msgprint(__('Batch and batch age are required to load standard values'));
            return;
        }


        frappe.call({
            method: 'wh_poultryos.api.get_standard_values',
            args: {
                'batch': frm.doc.batch,
                'age': frm.doc.batch_age_in_days,
                'module': "LAYER"
            },
            freeze: true,
            freeze_message: __('Loading standard values...'),
            callback: function (r) {
                if (r.message) {
                    frm.set_value('standard_mortality', r.message.mortality);
                    frm.set_value('standard_culls', r.message.culls);
                    frm.set_value('standard_average_bird_weight_in_grams', r.message.avg_weight);
                    frm.set_value('standard_total_feed_consumption_in_grams', r.message.feed_consumption);
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


}

function updateBatchAge(frm) {
    frappe.call({
        method: 'frappe.client.get',
        args: {
            doctype: 'Layer Batch',
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
                frm.set_value('batch_age_in_days', diffDays);
            }
        }
    });
}