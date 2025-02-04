frappe.pages['payment-success'].on_page_load = function (wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Payment Status',
		single_column: true
	});

	// Create a container for the message
	var message_container = $('<div class="payment-message-container"></div>').appendTo(page.main);

	// Get order_id from URL
	var order_id = getUrlParameter('order_id');

	if (!order_id) {
		message_container.html(`
            <div class="alert alert-warning">
                No order ID found in the URL.
            </div>
        `);
		return;
	}

	// Show loading state
	message_container.html(`
        <div class="alert alert-info">
            Processing your payment...
        </div>
    `);

	// Make API call to check payment status
	frappe.call({
		method: "wh_poultryos.payment.handle_payment_success",
		args: {
			order_id: order_id
		},
		callback: function (response) {
			var paymentStatus = response.message.status;
			var paymentMessage = response.message.message;

			if (paymentMessage === "Payment success, user balance updated") {
				message_container.html(`
                    <div class="alert alert-success">
                        <h4>Payment Successful!</h4>
                        ${paymentMessage ? `<p>${paymentMessage}</p>` : ''}
                    </div>
                `);
			} else {
				message_container.html(`
                    <div class="alert alert-danger">
                        <h4>Payment Failed</h4>
                        ${paymentMessage ? `<p>${paymentMessage}</p>` : ''}
                    </div>
                `);
			}
		},
		error: function (err) {
			message_container.html(`
                <div class="alert alert-danger">
                    <h4>Error</h4>
                    <p>An unexpected error occurred. Please try again later.</p>
                </div>
            `);
		}
	});
};

function getUrlParameter(name) {
	var urlParams = new URLSearchParams(window.location.search);
	return urlParams.get(name);
}