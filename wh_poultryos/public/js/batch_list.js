
frappe.listview_settings['Batch'] = {

    refresh: function (listview) {

        // frappe.call({
        //     method: 'wh_poultryos.session_getter.get_org_name_from_session',
        //     args: {},
        //     callback: function (r) {
        //         console.log(r);
        //         if (r.message) {
        //             console.log(r.message);
        //             // Set the hidden field value to the 'org_name' session variable
                    
        //             listview.filter_area.add('Batch', 'org_name', '=', r.message.org_name);
                    
        //         }
        //     }
        // });

        disableCreateBatchButton();

        function fetchAndDisplayCount() {
            frappe.call({
                method: "frappe.client.get_value",
                args: {
                    doctype: "Demo Batch Settings",
                    fieldname: "count",
                },
                callback: function (response) {
                    const count = response.message ? response.message.count : 0;

                    // Update or create the Demo Batch Count indicator
                    const $countIndicator = listview.page.wrapper.find('.demo-batch-count');
                    if ($countIndicator.length) {
                        $countIndicator.text(`Demo Batch Count: ${count}`);
                    } else {
                        const $newCountIndicator = $(`
                            <div class="demo-batch-count">
                                <strong>Demo Batch Count: ${count}</strong>
                            </div>
                        `).css({
                            color: '#007bff',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            marginLeft: '300px',
                        });

                        listview.page.wrapper.find('.page-actions').prepend($newCountIndicator);
                    }

                    // Show or hide Add Batch button
                    const addBatchButton = listview.page.wrapper.find('.btn-primary:contains("Add Batch")');
                    if (count <= 0) {
                        addBatchButton.hide();

                        // Show the message for expired demo batch count
                        frappe.msgprint({
                            title: __("Demo Batch Expired"),
                            message: __(
                                `Demo batch count expires. Now you have started the Live Batch. 
                                <br><br>Click <a href="/app/List/Live Batch" 
                                class="live-batch-link" style="color: #007bff; font-weight: bold;">
                                here</a> to open the Live Batch page.`
                            ),
                            indicator: "red",
                        });

                        // Add a click event handler for the "here" link
                        $(document).on("click", ".live-batch-link", function (event) {
                            frappe.set_route("List", "Live Batch").then(() => {
                                frappe.after_ajax(() => {
                                    if (cur_list) {
                                        cur_list.refresh();
                                    }
                                });
                            });
                        });
                    } else if (addBatchButton.length) {
                        addBatchButton.show();
                    }
                },
            });
        }

        // Fetch and display count on load
        fetchAndDisplayCount();

        // Attach fetchAndDisplayCount to the listview refresh event
        listview.page.wrapper.on('refresh', fetchAndDisplayCount);
    },

    // onload: function (listview) {

    //     console.log(listview);
    //     frappe.call({
    //         method: 'wh_poultryos.session_getter.get_org_name_from_session',
    //         args: {},
    //         callback: function (r) {
    //             if (r.message) {
    //                 console.log("Filtering by org_name:", r.message.org_name);

    //                 // Set the filter for the listview without making it visible
    //                 listview.filter_area.add('Batch', 'org_name', '=', r.message.org_name);

                    
                    
    //             }
    //         }
    //     });
    // }

};

// Function to disable "Create your first Live Batch" button
function disableCreateBatchButton() {
    setTimeout(() => {
        const createBatchButton = $('button:contains("Create your first Batch")');
        if (createBatchButton.length) {
            createBatchButton.prop("disabled", true).css({
                backgroundColor: "#d3d3d3", // Greyed out color
                cursor: "not-allowed",
            });
        }
    }, 100); // Delay to allow DOM elements to be available
}