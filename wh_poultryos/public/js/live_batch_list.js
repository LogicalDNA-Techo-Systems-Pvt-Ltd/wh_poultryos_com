// frappe.listview_settings['Live Batch'] = {

//     onload: function (listview) {
//         // Fetch the Demo Batch Count when the list view loads
//         frappe.call({
//             method: "frappe.client.get_value",
//             args: {
//                 doctype: "Live Batch Settings", // Replace with your actual doctype
//                 fieldname: "count", // Replace with the field storing batch count
//             },
//             callback: function (response) {
//                 const count = response.message ? response.message.count : 0;

//                 // Create the Demo Batch Count indicator
//                 const $countIndicator = $(`
//                     <div class="live-batch-count">
//                         <strong>Live Batch Count: ${count}</strong>
//                     </div>
//                 `).css({
//                     color: '#007bff',
//                     fontSize: '16px',
//                     fontWeight: 'bold',
//                     marginLeft: '410px', // Adjust this value to move it right
//                     marginRight: 'auto', // Push buttons to the right   
//                 });

//                 // Align Demo Batch Count on the same line as List View and Add Batch
//                 listview.page.wrapper.find('.page-head').css({
//                     display: 'flex',
//                     alignItems: 'center', // Align items vertically
//                     justifyContent: 'space-between', // Space between elements
//                 });

//                 // Prepend the indicator to the page actions container
//                 listview.page.wrapper.find('.page-actions').prepend($countIndicator);

//                 // Handle Add Batch button behavior
//                 if (count <= 0) {
//                     setTimeout(() => {
//                         const addBatchButton = listview.page.wrapper.find('.btn-primary:contains("Add Live Batch")');
//                         if (addBatchButton.length) {
//                             addBatchButton.hide();
//                         }
//                     }, 100);

//                     // Show a message to the user
//                     frappe.msgprint({
//                         title: __("Action Restricted"),
//                         message: __("Live Batch Count is 0. Please purchase tokens to add a new batch."),
//                         indicator: "red",
//                     });
//                 }
//             },
//         });
//     },
// };


// frappe.listview_settings['Live Batch'] = {
//     onload: function (listview) {
//         // Fetch the Demo Batch Count when the list view loads
//         frappe.call({
//             method: "frappe.client.get_value",
//             args: {
//                 doctype: "Live Batch Settings", // Replace with your actual doctype
//                 fieldname: "count", // Replace with the field storing batch count
//             },
//             callback: function (response) {
//                 const count = response.message ? response.message.count : 0;

//                 // Create the Live Batch Count indicator
//                 const $countIndicator = $(`
//                     <div class="live-batch-count">
//                         <strong>Live Batch Count: ${count}</strong>
//                     </div>
//                 `).css({
//                     color: '#007bff',
//                     fontSize: '16px',
//                     fontWeight: 'bold',
//                     marginLeft: '410px',
//                     marginRight: 'auto',
//                 });

//                 // Align Live Batch Count on the same line as List View and Add Batch
//                 listview.page.wrapper.find('.page-head').css({
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'space-between',
//                 });

//                 // Prepend the indicator to the page actions container
//                 listview.page.wrapper.find('.page-actions').prepend($countIndicator);

//                 // Handle Add Batch button behavior
//                 if (count <= 0) {
//                     setTimeout(() => {
//                         const addBatchButton = listview.page.wrapper.find('.btn-primary:contains("Add Live Batch")');
//                         if (addBatchButton.length) {
//                             addBatchButton.hide();
//                         }

//                          // Disable "Create your first Live Batch" button
//                          const createBatchButton = listview.page.wrapper.find('button:contains("Create your first Live Batch")');
//                          if (createBatchButton.length) {
//                              createBatchButton.prop("disabled", true).css({
//                                  backgroundColor: "#d3d3d3", // Greyed out color
//                                  cursor: "not-allowed",
//                              });
//                          }

//                         // Show the message after ensuring the DOM is updated
//                         frappe.msgprint({
//                             title: __("Action Restricted"),
//                             message: __("Live Batch Count is 0. Please purchase tokens to add a new batch."),
//                             indicator: "red",
//                         });
//                     }, 200); // Delay to allow DOM updates
//                 }
//             },
//         });
//     },
// };

// frappe.listview_settings['Live Batch'] = {

//     onload: function (listview) {

//         // Fetch the Live Batch Count when the list view loads
//         frappe.call({
//             method: "frappe.client.get_value",
//             args: {
//                 doctype: "Live Batch Settings", // Replace with your actual doctype
//                 fieldname: "count", // Replace with the field storing batch count
//             },
//             callback: function (response) {
//                 const count = response.message ? response.message.count : 0;

//                 // Create the Live Batch Count indicator
//                 const $countIndicator = $(`
//                     <div class="live-batch-count">
//                         <strong>Live Batch Count: ${count}</strong>
//                     </div>
//                 `).css({
//                     color: '#007bff',
//                     fontSize: '16px',
//                     fontWeight: 'bold',
//                     marginLeft: '410px',
//                     marginRight: 'auto',
//                 });

//                 // Align Live Batch Count on the same line as List View and Add Batch
//                 listview.page.wrapper.find('.page-head').css({
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'space-between',
//                 });

//                 // Prepend the indicator to the page actions container
//                 listview.page.wrapper.find('.page-actions').prepend($countIndicator);

//                 // If count is 0, hide Add Batch button and disable Create Batch button
//                 if (count <= 0) {

//                     setTimeout(() => {
//                         const addBatchButton = listview.page.wrapper.find('.btn-primary:contains("Add Live Batch")');
//                         if (addBatchButton.length) {
//                             addBatchButton.hide();
//                         }

//                         // Show message
//                         frappe.msgprint({
//                             title: __("Action Restricted"),
//                             message: __("Live Batch Count is 0. Please purchase tokens to add a new batch."),
//                             indicator: "red",
//                         });
//                     }, 200);
//                 }
//             },
//         });


//     },



// };

frappe.listview_settings['Live Batch'] = {

    refresh: function (listview) {

        disableCreateBatchButton();
        function fetchAndDisplayCount() {
            frappe.call({
                method: "frappe.client.get_value",
                args: {
                    doctype: "Live Batch Settings", // Replace with your actual doctype
                    fieldname: "count", // Replace with the field storing batch count
                },
                callback: function (response) {
                    const count = response.message ? response.message.count : 0;

                    // Create the Live Batch Count indicator

                    const $countIndicator = listview.page.wrapper.find('.live-batch-count');
                    if ($countIndicator.length) {
                        $countIndicator.text(`Live Batch Count: ${count}`);
                    } else {
                        const $newCountIndicator = $(`
                            <div class="live-batch-count">
                                <strong>Live Batch Count: ${count}</strong>
                            </div>
                        `).css({
                            color: '#007bff',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            marginLeft: '300px',
                        });

                        listview.page.wrapper.find('.page-actions').prepend($newCountIndicator);
                    }


                    // If count is 0, hide Add Batch button and disable Create Batch button
                    if (count <= 0) {

                        setTimeout(() => {
                            const addBatchButton = listview.page.wrapper.find('.btn-primary:contains("Add Live Batch")');
                            if (addBatchButton.length) {
                                addBatchButton.hide();
                            }

                            // Show message
                            frappe.msgprint({
                                title: __("Action Restricted"),
                                message: __("Live Batch Count is 0. Please purchase tokens to add a new batch."),
                                indicator: "red",
                            });
                        }, 200);
                    }
                },
            });


        }
        fetchAndDisplayCount()

        listview.page.wrapper.on('refresh', fetchAndDisplayCount);
    },

};

// Function to disable "Create your first Live Batch" button
function disableCreateBatchButton() {
    setTimeout(() => {
        const createBatchButton = $('button:contains("Create your first Live Batch")');
        if (createBatchButton.length) {
            createBatchButton.prop("disabled", true).css({
                backgroundColor: "#d3d3d3", // Greyed out color
                cursor: "not-allowed",
            });
        }
    }, 100); // Delay to allow DOM elements to be available
}




