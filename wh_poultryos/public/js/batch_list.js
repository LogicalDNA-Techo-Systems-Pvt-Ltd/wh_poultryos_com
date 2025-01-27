frappe.listview_settings['Batch'] = {
    onload: function (listview) {
        // Fetch the Demo Batch Count when the list view loads
        frappe.call({
            method: "frappe.client.get_value",
            args: {
                doctype: "Demo Batch Settings", // Replace with your actual doctype
                fieldname: "count", // Replace with the field storing batch count
            },
            callback: function (response) {
                const count = response.message ? response.message.count : 0;

                // Create the Demo Batch Count indicator
                const $countIndicator = $(`
                    <div class="demo-batch-count">
                        <strong>Demo Batch Count: ${count}</strong>
                    </div>
                `).css({
                    color: '#007bff',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginLeft: '410px', // Adjust this value to move it right
                    marginRight: 'auto', // Push buttons to the right   
                });

                // Align Demo Batch Count on the same line as List View and Add Batch
                listview.page.wrapper.find('.page-head').css({
                    display: 'flex',
                    alignItems: 'center', // Align items vertically
                    justifyContent: 'space-between', // Space between elements
                });

                // Prepend the indicator to the page actions container
                listview.page.wrapper.find('.page-actions').prepend($countIndicator);

                // Handle Add Batch button behavior
                if (count <= 0) {
                    setTimeout(() => {
                        const addBatchButton = listview.page.wrapper.find('.btn-primary:contains("Add Batch")');
                        if (addBatchButton.length) {
                            addBatchButton.hide();
                        }
                    }, 100);

                    // Show a message to the user
                    frappe.msgprint({
                        title: __("Action Restricted"),
                        message: __("Demo Batch Count is 0. Please purchase tokens to add a new batch."),
                        indicator: "red",
                    });
                }
            },
        });
    },
};
