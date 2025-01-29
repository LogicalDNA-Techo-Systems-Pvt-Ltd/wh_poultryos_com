// frappe.listview_settings['Batch'] = {

//     // onload: function (listview) {
//     //     // Fetch the Demo Batch Count when the list view loads
//     //     frappe.call({
//     //         method: "frappe.client.get_value",
//     //         args: {
//     //             doctype: "Demo Batch Settings", // Replace with your actual doctype
//     //             fieldname: "count", // Replace with the field storing batch count
//     //         },
//     //         callback: function (response) {
//     //             const count = response.message ? response.message.count : 0;

//     //             // Create the Demo Batch Count indicator
//     //             const $countIndicator = $(`
//     //                 <div class="demo-batch-count">
//     //                     <strong>Demo Batch Count: ${count}</strong>
//     //                 </div>
//     //             `).css({
//     //                 color: '#007bff',
//     //                 fontSize: '16px',
//     //                 fontWeight: 'bold',
//     //                 marginLeft: '300px', // Adjust this value to move it right
//     //                 marginRight: 'auto', // Push buttons to the right
//     //             });

//     //             // Align Demo Batch Count on the same line as List View and Add Batch
//     //             listview.page.wrapper.find('.page-head').css({
//     //                 display: 'flex',
//     //                 alignItems: 'center', // Align items vertically
//     //                 justifyContent: 'space-between', // Space between elements
//     //             });

//     //             // Prepend the indicator to the page actions container
//     //             listview.page.wrapper.find('.page-actions').prepend($countIndicator);

//     //             // Handle Add Batch button behavior
//     //             if (count <= 0) {
//     //                 setTimeout(() => {
//     //                     const addBatchButton = listview.page.wrapper.find('.btn-primary:contains("Add Batch")');
//     //                     if (addBatchButton.length) {
//     //                         addBatchButton.hide();
//     //                     }
//     //                 }, 100);

//     //                 // Show a message to the user with a clickable link
//     //                 frappe.msgprint({
//     //                     title: __("Action Restricted"),
//     //                     message: __(
//     //                         `Demo Batch Count is 0. Please purchase tokens to add a new batch. 
//     //                         <br><br>Click <a href="/app/live-batch" class="live-batch-link" style="color: #007bff; font-weight: bold;">here</a> to open the Live Batch page.`
//     //                     ),
//     //                     indicator: "red",
//     //                 });

//     //                 // Add a click event handler for the "here" link
//     //                 $(document).on("click", ".live-batch-link", function (event) {
//     //                     // event.preventDefault();
//     //                     frappe.set_route("List", "Live Batch").then(() => {
//     //                         // Ensure the list view script is executed after redirection
//     //                         frappe.after_ajax(() => {
//     //                             if (frappe.listview_settings["Live Batch"] && frappe.listview_settings["Live Batch"].onload) {
//     //                                 const liveBatchListview = cur_list; // Get the current list view
//     //                                 frappe.listview_settings["Live Batch"].onload(liveBatchListview);

//     //                                 // Call the function that refreshes the live batch list
//     //                                 liveBatchListview.refresh();
//     //                             }
//     //                         });
//     //                     });
//     //                 });
//     //             }
//     //         },
//     //     });
//     // },

//     refresh: function (listview) {

//         function fetchAndDisplayCount() {
//             frappe.call({
//                 method: "frappe.client.get_value",
//                 args: {
//                     doctype: "Demo Batch Settings",
//                     fieldname: "count",
//                 },
//                 callback: function (response) {
//                     const count = response.message ? response.message.count : 0;

//                     // Update or create the Demo Batch Count indicator
//                     const $countIndicator = listview.page.wrapper.find('.demo-batch-count');
//                     if ($countIndicator.length) {
//                         $countIndicator.text(`Demo Batch Count: ${count}`);
//                     } else {
//                         const $newCountIndicator = $(`
//                             <div class="demo-batch-count">
//                                 <strong>Demo Batch Count: ${count}</strong>
//                             </div>
//                         `).css({
//                             color: '#007bff',
//                             fontSize: '16px',
//                             fontWeight: 'bold',
//                             marginLeft: '300px',
//                         });

//                         listview.page.wrapper.find('.page-actions').prepend($newCountIndicator);
//                     }

//                     // Show or hide Add Batch button
//                     const addBatchButton = listview.page.wrapper.find('.btn-primary:contains("Add Batch")');
//                     if (count <= 0 && addBatchButton.length) {
//                         addBatchButton.hide();
//                     } else if (addBatchButton.length) {
//                         addBatchButton.show();
//                     }
//                 },
//             });
//         }

//         // Fetch and display count on load
//         fetchAndDisplayCount();

//         // Attach fetchAndDisplayCount to the listview refresh event
//         listview.page.wrapper.on('refresh', fetchAndDisplayCount);
    
//     },
// };

frappe.listview_settings['Batch'] = {
    refresh: function (listview) {

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
                    if (count <= 0 && addBatchButton.length) {
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
};
