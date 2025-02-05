frappe.listview_settings['CBF Batch'] = {
    primary_action() {
        // Get the current logged-in user's ID
        var user_id = frappe.session.user;

        // Fetch CBF Batch cost from Batch Settings
        frappe.call({
            method: 'frappe.client.get_value',
            args: {
                doctype: 'Batch Settings',
                fieldname: 'cbf_batch_cost'
            },
            callback: function (response) {
                var cbf_batch_cost = response.message.cbf_batch_cost;
                console.log("cbf_batch_cost", cbf_batch_cost);

                // Fetch the current token balance of the user
                frappe.call({
                    method: 'frappe.client.get_value',
                    args: {
                        doctype: 'User Balance',
                        filters: { 'user': user_id },
                        fieldname: 'available_balance'
                    },
                    callback: function (response) {
                        var user_balance = response.message.available_balance;
                        if (typeof user_balance === "undefined") {
                            user_balance = 0;
                        }
                        console.log("user_balance", user_balance);

                        // Check if the user has sufficient balance
                        if (user_balance > 0) {
                            // Sufficient balance, redirect to CBF Batch creation page
                            frappe.set_route('Form', 'CBF Batch', 'new-cbf-batch');
                        } else {
                            // Insufficient balance, show dialog to purchase tokens
                            let amount_needed = cbf_batch_cost;
                            console.log("amount_needed", amount_needed);
                            showPaymentDialog(amount_needed);
                        }
                    }
                });
            }
        });
    }
};

function showPaymentDialog(amount_needed) {
    // Create a dialog for the payment prompt
    var dialog = new frappe.ui.Dialog({
        title: 'Insufficient Tokens',
        fields: [
            {
                label: 'You need to purchase more tokens.',
                fieldtype: 'HTML',
                options: `<p>You need more tokens to proceed with creating the CBF Batch.</p>`
            },
            {
                label: 'Number of Batches',
                fieldname: 'batch_count',
                fieldtype: 'Int',
                default: 1,
                min: 1,
                onchange: function () {
                    // Calculate new total based on batch count
                    let batch_count = dialog.get_value('batch_count');
                    let total_amount = amount_needed * batch_count;

                    // Update the amount field
                    dialog.set_value('amount', total_amount);

                    // Update the HTML message
                    dialog.set_value('message_html',
                        `<p>You need <strong>${total_amount}</strong> tokens to proceed with creating ${batch_count} CBF Batch${batch_count > 1 ? 'es' : ''}.</p>`
                    );
                }
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
                    // Close the dialog and redirect to the payment gateway
                    // Pass both amount and batch count
                    let total_amount = dialog.get_value('amount');
                    let batch_count = dialog.get_value('batch_count');
                    dialog.hide();
                    redirectToPayment(total_amount, batch_count);
                }
            }
        ]
    });

    // Open the dialog
    dialog.show();
}

// Function to redirect to Cashfree payment gateway
function redirectToPayment(total_amount, batch_count) {
    const cashfree = window.Cashfree({
        mode: "sandbox",
    });
    const base_url = window.location.origin;
    frappe.call({
        method: 'wh_poultryos.payment_controller.create_payment_order',
        args: {
            amount_needed: total_amount,
            batch_count: batch_count,
        },
        callback: function (response) {
            console.log(response);
            let checkoutOptions = {
                paymentSessionId: response.message.payment_session_id,
                redirectTarget: "_self",
                returnUrl: base_url + "/app/payment-success?order_id=" + response.message.order_id,
            };
            console.log(checkoutOptions);
            cashfree.checkout(checkoutOptions).then(function (result) {
                if (result.error) {
                    alert(result.error.message);
                }
                if (result.redirect) {
                    console.log("Redirection");
                }
            });
        }
    });
}