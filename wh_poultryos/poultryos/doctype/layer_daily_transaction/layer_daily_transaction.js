// Copyright (c) 2024, LogicalDNA Techno Systems Pvt Ltd and contributors
// For license information, please see license.txt

frappe.ui.form.on('Layer Daily Transaction', {

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

    average_bird_weight_in_grams: function (frm) {
        // Automatically update weight in KG when weight in grams is entered
        frm.set_value("average_bird_weight_in_kg", (frm.doc.average_bird_weight_in_grams / 1000));
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

    after_save: function (frm) {

    }

});

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
        if (!frm.doc.batch || !frm.doc.batch_age) {
            frappe.msgprint(__('Batch and batch age are required to load standard values'));
            return;
        }

        frappe.call({
            method: 'wh_poultryos.api.get_standard_values',
            args: {
                'batch': frm.doc.batch,
                'age': frm.doc.batch_age
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