frappe.pages['demo-dashboard'].on_page_load = function(wrapper) {
    // Fetch the count dynamically from Demo Batch Settings
    frappe.call({
        method: "frappe.client.get_value",
        args: {
            doctype: "Demo Batch Settings", // Replace with your actual doctype
            fieldname: "count",
        },
        callback: function(response) {
            const count = response.message ? response.message.count : 0;
            
            // Create the count text
            const $countIndicator = $(`
                <div style="font-size: 14px; color: #007bff; font-weight: bold; margin-left: 20px;">
                    Demo Batch Count: ${count}
                </div>
            `);

            // Append it next to the page title
            const $pageTitle = wrapper.find('.page-title');
            if ($pageTitle.length) {
                $pageTitle.css({
                    display: 'flex',
                    alignItems: 'center',
                });
                $pageTitle.append($countIndicator);
            }
        },
    });
};
