// Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
// For license information, please see license.txt

frappe.ui.form.on('Breeder Batch', {
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
        if (frm.doc.opening_date) {
            let formatted_date = frappe.datetime.obj_to_user(frm.doc.opening_date);
            frm.set_value('live_batch_date', formatted_date);
        }

        let opening_date = frappe.datetime.obj_to_user(frm.doc.opening_date);
        let today = frm.doc.live_batch_date;
        let days_diff = frappe.datetime.get_diff(today, opening_date);
        frm.set_value("batch_age_in_days", days_diff || 0);
    },

    rate: function (frm) {
        frm.set_value('amount', frm.doc.place_quantity_number_of_birds * frm.doc.rate);
        frm.set_value('biological_value', frm.doc.place_quantity_number_of_birds * frm.doc.rate);
        frm.set_value('bird_cost', frm.doc.rate);
    },

    before_save: function (frm) {
        if (frm.is_new()) {
            console.log("New Breeder Batch Detected in before_save");
            return new Promise((resolve, reject) => {
                checkTokenBalance(frm, resolve, reject);
            });
        } else {
            console.log("Existing Breeder Batch Modified: No Count Change Needed");
        }
    },

    after_save: function (frm) {
        if (!validateMandatoryFields(frm)) {
            return;
        }
        frappe.set_route("List", "Breeder Batch");
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

    // Fetch Breeder Batch cost from Batch Settings
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'Batch Settings',
            fieldname: 'breeder_batch_cost'
        },
        callback: function (r) {
            const breeder_batch_cost = r.message.breeder_batch_cost;

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

                    if (user_balance < breeder_batch_cost) {
                        // Show payment dialog if insufficient balance
                        showPaymentDialog(breeder_batch_cost, 1, frm, resolve, reject);
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
                options: `<p>You need <strong>${amount_needed}</strong> tokens to create a new Breeder Batch.</p>`
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
                returnUrl: base_url + "/app/breeder-batch/new-breeder-batch",
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