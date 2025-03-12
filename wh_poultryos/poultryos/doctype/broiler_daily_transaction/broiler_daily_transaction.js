// apps/wh_poultryos/wh_poultryos/poultryos/doctype/broiler_daily_transaction/broiler_daily_transaction.js
// Client script for Broiler Daily Transaction
frappe.ui.form.on('Broiler Daily Transaction', {
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
            fetchBatchDetails(frm);
        }
    },

    transaction_date: function (frm) {
        // If both batch and transaction date are set, update batch age
        if (frm.doc.batch && frm.doc.transaction_date) {
            updateBatchAge(frm);
        }
    },

    // Calculate consumption cost automatically
    validate: function (frm) {
        calculateAllConsumptionCosts(frm);

        // Check for missing critical values
        validateRequiredFields(frm);
    }
});

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
    }
});

function setupCustomButtons(frm) {
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

    // Add a custom button to update batch statistics
    frm.add_custom_button(__('Update Batch Statistics'), function () {
        if (!frm.doc.batch) {
            frappe.msgprint(__('Batch is required to update statistics'));
            return;
        }

        frappe.call({
            method: 'wh_poultryos.api.update_batch_stats',
            args: {
                'batch': frm.doc.batch
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
            }
        }
    });
}

function calculateConsumptionCost(frm, cdt, cdn) {
    var row = locals[cdt][cdn];

    // Ensure quantity and rate are not undefined
    var qty = row.consumption_qty || 0;
    var rate = row.consumption_rate || 0;

    // Calculate cost
    row.consumption_cost = qty * rate;

    // Update feed consumption total when feed type is modified
    if (row.consumption_type === 'Feed') {
        updateTotalFeedConsumption(frm);
    }

    frm.refresh_field('consumption_details');
}

function calculateAllConsumptionCosts(frm) {
    // Process each row in consumption details
    $.each(frm.doc.consumption_details || [], function (i, d) {
        d.consumption_cost = (d.consumption_qty || 0) * (d.consumption_rate || 0);
    });

    // Update total feed consumption
    updateTotalFeedConsumption(frm);

    // Re-render the grid
    frm.refresh_field('consumption_details');
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
}

function validateRequiredFields(frm) {
    var warnings = [];

    // Check for critical missing values
    if (!frm.doc.actual_avg_bird_weight) {
        warnings.push(__('Actual Average Bird Weight is missing'));
    }

    if (frm.doc.consumption_details.length === 0) {
        warnings.push(__('No consumption details have been added'));
    }

    // Display warnings if any
    if (warnings.length > 0) {
        frappe.msgprint({
            title: __('Warning'),
            indicator: 'yellow',
            message: warnings.join('<br>')
        });
    }
}